"use client";

import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import {
  getReducedMotion as reducedMotion,
  useReducedMotion,
} from "@/lib/motion-preference";
import {
  findSchoolLocation,
  SCHOOL_GEOJSON,
  type SchoolLocation,
} from "@/lib/school-locations";
import {
  QATAR_MAP_BOUNDS,
  QATAR_MAP_MIN_ZOOM,
  SCHOOL_MAP_FIT_BOUNDS,
} from "@/lib/school-map-bounds";
import { SCHOOL_MAP_LAYERS } from "@/lib/school-map-layers";

const STYLE = "https://tiles.openfreemap.org/styles/dark";
const SOURCE = "astra-schools";
const MAX_ZOOM = 18;
maplibregl.setWorkerUrl("/maplibre-gl-worker.mjs");

export default function SchoolMap({
  selected,
  onSelect,
  onRetry,
}: {
  selected: SchoolLocation | null;
  onSelect: (school: SchoolLocation) => void;
  onRetry: () => void;
}) {
  const reduced = useReducedMotion();
  const host = useRef<HTMLElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const sharedLocationPopupRef = useRef<maplibregl.Popup | null>(null);
  const selectedFilterRef = useRef<string | null>(null);
  const selectRef = useRef(onSelect);
  const selectedRef = useRef(selected);
  const viewRef = useRef<{
    center: [number, number];
    zoom: number;
    bearing: number;
    pitch: number;
    selected: SchoolLocation | null;
    focused: boolean;
  } | null>(null);
  const [failure, setFailure] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  useEffect(() => {
    selectRef.current = onSelect;
    selectedRef.current = selected;
  }, [onSelect, selected]);

  useEffect(() => {
    const container = host.current;
    if (!container || mapRef.current) return;
    // MapLibre 6 exposes reduceMotion only at construction. Recreate only on an
    // effective policy change, retaining the visitor's view and selected school.
    // This also governs built-in keyboard/double-click and gesture inertia.
    const savedView = viewRef.current;
    setMapLoaded(false);
    let map: maplibregl.Map;
    let resize: ResizeObserver | undefined;
    let disposed = false;
    let prepared = false;
    delete container.dataset.prepared;
    const timeout = window.setTimeout(() => {
      if (!disposed) setFailure(true);
    }, 25000);
    try {
      map = new maplibregl.Map({
        container,
        style: STYLE,
        center: savedView?.center ?? [51.35, 25.4],
        zoom: savedView?.zoom ?? 8.2,
        bearing: savedView?.bearing ?? 0,
        pitch: savedView?.pitch ?? 0,
        reduceMotion: reduced,
        attributionControl: false,
        maxZoom: MAX_ZOOM,
        minZoom: QATAR_MAP_MIN_ZOOM,
        maxBounds: QATAR_MAP_BOUNDS,
        renderWorldCopies: false,
      });
      mapRef.current = map;
      if (savedView?.focused && document.activeElement === document.body)
        map.getCanvas().focus({ preventScroll: true });
      map.addControl(
        new maplibregl.AttributionControl({
          compact: true,
          customAttribution:
            '<a href="https://myschools.edu.gov.qa/myschool/?culture=En" target="_blank" rel="noreferrer">Schools: Qatar MOEHE</a>',
        }),
        "bottom-left",
      );
      map.on("error", () => {
        if (!disposed) setFailure(true);
      });
      // A later successful render recovers from transient tile/network errors.
      map.on("idle", () => {
        if (disposed || !map.isStyleLoaded()) return;
        setFailure(false);
        if (
          !prepared &&
          map.areTilesLoaded() &&
          map.getLayer("astra-points") &&
          map.isSourceLoaded(SOURCE) &&
          map.queryRenderedFeatures({
            layers: ["astra-points", "astra-clusters"],
          }).length
        ) {
          prepared = true;
          container.dataset.prepared = "true";
        }
      });
      map.once("load", () => {
        if (disposed) return;
        window.clearTimeout(timeout);
        map.addSource(SOURCE, {
          type: "geojson",
          data: SCHOOL_GEOJSON,
          cluster: true,
          clusterRadius: 42,
          // Never dissolve coincident schools into indistinguishable dots.
          maxzoom: MAX_ZOOM + 1,
          clusterMaxZoom: MAX_ZOOM,
        });
        for (const layer of SCHOOL_MAP_LAYERS) {
          map.addLayer(layer);
        }
        selectedFilterRef.current = "";
        map.on("click", "astra-clusters", async (event) => {
          const feature = event.features?.[0];
          if (feature?.geometry.type !== "Point") return;
          const source = map.getSource(SOURCE) as maplibregl.GeoJSONSource;
          try {
            const zoom = await source.getClusterExpansionZoom(
              Number(feature.properties.cluster_id),
            );
            if (disposed) return;
            sharedLocationPopupRef.current?.remove();
            if (zoom <= MAX_ZOOM && map.getZoom() < MAX_ZOOM) {
              map.easeTo({
                center: feature.geometry.coordinates as [number, number],
                zoom,
                duration: reducedMotion() ? 0 : 500,
                essential: !reducedMotion(),
              });
              return;
            }
            const leaves = await source.getClusterLeaves(
              Number(feature.properties.cluster_id),
              Number(feature.properties.point_count),
              0,
            );
            if (disposed) return;
            const schools = [
              ...new Set(leaves.map((leaf) => String(leaf.properties?.id))),
            ]
              .map(findSchoolLocation)
              .filter((school): school is SchoolLocation => Boolean(school))
              .sort((a, b) => a.name.localeCompare(b.name, "en"));
            const content = document.createElement("div");
            content.className = "school-map-location-picker";
            content.setAttribute("role", "group");
            content.setAttribute("aria-label", "Schools at this location");
            content.setAttribute("data-lenis-prevent", "");
            const title = document.createElement("strong");
            title.textContent = `${schools.length} schools at this location`;
            content.append(title);
            const popup = new maplibregl.Popup({
              className: "school-map-popup",
              maxWidth: "300px",
              offset: 18,
              closeOnMove: true,
            });
            for (const school of schools) {
              const button = document.createElement("button");
              button.type = "button";
              button.textContent = school.name;
              button.addEventListener("click", () => {
                popup.remove();
                selectRef.current(school);
              });
              content.append(button);
            }
            sharedLocationPopupRef.current = popup
              .setLngLat(feature.geometry.coordinates as [number, number])
              .setDOMContent(content)
              .addTo(map);
          } catch {
            if (!disposed) setFailure(true);
          }
        });
        map.on("click", "astra-points", (event) => {
          const school = findSchoolLocation(
            String(event.features?.[0]?.properties.id),
          );
          if (school) selectRef.current(school);
        });
        for (const layer of ["astra-clusters", "astra-points"]) {
          map.on("mouseenter", layer, () => {
            map.getCanvas().style.cursor = "pointer";
          });
          map.on("mouseleave", layer, () => {
            map.getCanvas().style.cursor = "";
          });
        }
        if (!savedView)
          map.fitBounds(SCHOOL_MAP_FIT_BOUNDS, {
            padding: { top: 65, bottom: 55, left: 35, right: 35 },
            maxZoom: 9,
            duration: 0,
          });
        setMapLoaded(true);
        setFailure(false);
      });
      resize = new ResizeObserver(() => {
        if (!disposed) map.resize();
      });
      resize.observe(container);
    } catch {
      window.clearTimeout(timeout);
      setFailure(true);
    }
    return () => {
      disposed = true;
      window.clearTimeout(timeout);
      resize?.disconnect();
      const current = mapRef.current;
      if (current)
        viewRef.current = {
          center: current.getCenter().toArray(),
          zoom: current.getZoom(),
          bearing: current.getBearing(),
          pitch: current.getPitch(),
          selected: selectedRef.current,
          focused: document.activeElement === current.getCanvas(),
        };
      mapRef.current?.remove();
      sharedLocationPopupRef.current?.remove();
      sharedLocationPopupRef.current = null;
      mapRef.current = null;
    };
  }, [reduced]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    sharedLocationPopupRef.current?.remove();
    const selectedId = selected?.id ?? "";
    if (selectedFilterRef.current !== selectedId) {
      map.setFilter("astra-selected", ["==", ["get", "id"], selectedId]);
      selectedFilterRef.current = selectedId;
    }
    if (!selected) return;
    const content = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = selected.name;
    const locality = document.createElement("span");
    locality.textContent = selected.locality || selected.municipality;
    content.append(title, locality);
    const popup = new maplibregl.Popup({
      className: "school-map-popup",
      offset: 15,
      maxWidth: "250px",
      focusAfterOpen: false,
      closeOnClick: false,
    })
      .setLngLat(selected.coordinates)
      .setDOMContent(content)
      .addTo(map);
    if (viewRef.current?.selected !== selected)
      map.flyTo({
        center: selected.coordinates,
        zoom: 14.5,
        duration: reducedMotion() ? 0 : 650,
        essential: !reducedMotion(),
      });
    return () => {
      popup.remove();
    };
  }, [mapLoaded, selected]);

  return (
    <div
      className="school-map-frame"
      data-map-state={failure ? "unavailable" : mapLoaded ? "ready" : "loading"}
      data-school-count={SCHOOL_GEOJSON.features.length}
      data-lenis-prevent
    >
      <section
        ref={host}
        className="school-map-canvas"
        aria-label="Interactive map of listed schools in Qatar. Use the school search for keyboard selection."
      />
      {failure && (
        <div
          className={`map-fallback ${mapLoaded ? "map-fallback-inline" : ""}`}
          role="status"
        >
          <strong>Map tiles are unavailable right now.</strong>
          <span>Search and school selection are still available.</span>
          <small className="map-fallback-credit">
            © OpenFreeMap · OpenMapTiles · OpenStreetMap
          </small>
          <button type="button" onClick={onRetry}>
            Try loading the map again
          </button>
        </div>
      )}
      <div className="map-controls">
        <button
          type="button"
          aria-label="Zoom in"
          onClick={() =>
            mapRef.current?.zoomIn({
              duration: reducedMotion() ? 0 : 300,
              essential: !reducedMotion(),
            })
          }
        >
          +
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          onClick={() =>
            mapRef.current?.zoomOut({
              duration: reducedMotion() ? 0 : 300,
              essential: !reducedMotion(),
            })
          }
        >
          −
        </button>
      </div>
    </div>
  );
}
