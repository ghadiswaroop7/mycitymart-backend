import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

interface LocationCoords {
  latitude: number;
  longitude: number;
  address?: string;
}

interface LiveOrderMapProps {
  customerLocation?: LocationCoords;
  riderLocation?: LocationCoords;
  status?: string;
  riderName?: string;
}

export default function LiveOrderMap({
  customerLocation = { latitude: 21.1458, longitude: 79.0882 },
  riderLocation,
  status = 'pending',
  riderName = 'Rider',
}: LiveOrderMapProps) {
  const webViewRef = useRef<any>(null);

  const customerLat = customerLocation?.latitude || 21.1458;
  const customerLng = customerLocation?.longitude || 79.0882;

  // Initial rider location offset if not provided yet
  const riderLat = riderLocation?.latitude || (customerLat - 0.015);
  const riderLng = riderLocation?.longitude || (customerLng - 0.012);

  const isPickedUp = ['picked_up', 'on_the_way'].includes(status?.toLowerCase());

  // Leaflet HTML template
  const generateMapHtml = () => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          html, body, #map {
            height: 100%;
            width: 100%;
            margin: 0;
            padding: 0;
            background-color: #e5e7eb;
          }
          .custom-home-pin {
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .home-pin-card {
            background-color: #008B45;
            color: white;
            border-radius: 50%;
            width: 44px;
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            border: 3px solid white;
          }
          .custom-bike-pin {
            transition: transform 0.8s ease-out;
          }
          .bike-pin-card {
            background-color: #FA8C16;
            color: white;
            border-radius: 50%;
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 6px 16px rgba(250, 140, 22, 0.4);
            border: 3px solid white;
            animation: pulse-ring 2s infinite;
          }
          @keyframes pulse-ring {
            0% { box-shadow: 0 0 0 0 rgba(250, 140, 22, 0.6); }
            70% { box-shadow: 0 0 0 12px rgba(250, 140, 22, 0); }
            100% { box-shadow: 0 0 0 0 rgba(250, 140, 22, 0); }
          }
          .marker-label {
            position: absolute;
            bottom: -22px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            font-size: 10px;
            font-weight: 800;
            padding: 2px 8px;
            border-radius: 10px;
            white-space: nowrap;
            font-family: sans-serif;
            letter-spacing: 0.5px;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map', { zoomControl: false }).setView([${customerLat}, ${customerLng}], 14);

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
          }).addTo(map);

          // Home Icon
          var homeIcon = L.divIcon({
            className: 'custom-home-pin',
            html: '<div class="home-pin-card"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg><div class="marker-label">HOME</div></div>',
            iconSize: [44, 44],
            iconAnchor: [22, 22]
          });

          var homeMarker = L.marker([${customerLat}, ${customerLng}], { icon: homeIcon }).addTo(map);

          var bikeMarker = null;
          var routePolyline = null;

          var isPickedUp = ${isPickedUp ? 'true' : 'false'};

          if (isPickedUp) {
            // Bike Icon
            var bikeIcon = L.divIcon({
              className: 'custom-bike-pin',
              html: '<div class="bike-pin-card"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6h2.5l2 3H21M15 6h-3.5L8.5 12.5M15 6v6.5M8.5 12.5H4.5M8.5 12.5L6.5 6H4"/></svg><div class="marker-label">${riderName}</div></div>',
              iconSize: [48, 48],
              iconAnchor: [24, 24]
            });

            bikeMarker = L.marker([${riderLat}, ${riderLng}], { icon: bikeIcon }).addTo(map);

            // Connect route line
            var routeCoords = [[${riderLat}, ${riderLng}], [${customerLat}, ${customerLng}]];
            routePolyline = L.polyline(routeCoords, {
              color: '#FA8C16',
              weight: 4,
              dashArray: '8, 8',
              opacity: 0.8
            }).addTo(map);

            // Fit bounds
            var bounds = L.latLngBounds([[${riderLat}, ${riderLng}], [${customerLat}, ${customerLng}]]);
            map.fitBounds(bounds, { padding: [50, 50] });
          }

          // Function to update rider position smoothly
          window.updateRiderPosition = function(newLat, newLng) {
            if (!bikeMarker) {
              var bikeIcon = L.divIcon({
                className: 'custom-bike-pin',
                html: '<div class="bike-pin-card"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6h2.5l2 3H21M15 6h-3.5L8.5 12.5M15 6v6.5M8.5 12.5H4.5M8.5 12.5L6.5 6H4"/></svg><div class="marker-label">${riderName}</div></div>',
                iconSize: [48, 48],
                iconAnchor: [24, 24]
              });
              bikeMarker = L.marker([newLat, newLng], { icon: bikeIcon }).addTo(map);
            } else {
              // Smooth movement animation
              var startLat = bikeMarker.getLatLng().lat;
              var startLng = bikeMarker.getLatLng().lng;
              var frames = 30;
              var currentFrame = 0;

              function animate() {
                currentFrame++;
                var progress = currentFrame / frames;
                var currLat = startLat + (newLat - startLat) * progress;
                var currLng = startLng + (newLng - startLng) * progress;

                bikeMarker.setLatLng([currLat, currLng]);

                if (routePolyline) {
                  routePolyline.setLatLngs([[currLat, currLng], [${customerLat}, ${customerLng}]]);
                }

                if (currentFrame < frames) {
                  requestAnimationFrame(animate);
                }
              }
              animate();
            }

            var bounds = L.latLngBounds([[newLat, newLng], [${customerLat}, ${customerLng}]]);
            map.fitBounds(bounds, { padding: [60, 60] });
          };
        </script>
      </body>
    </html>
  `;

  // Send message to WebView when props change
  useEffect(() => {
    if (webViewRef.current && riderLocation?.latitude && riderLocation?.longitude) {
      const jsCode = `if (window.updateRiderPosition) { window.updateRiderPosition(${riderLocation.latitude}, ${riderLocation.longitude}); } true;`;
      webViewRef.current.injectJavaScript(jsCode);
    }
  }, [riderLocation?.latitude, riderLocation?.longitude]);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <iframe
          srcDoc={generateMapHtml()}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="Live Delivery Map"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: generateMapHtml() }}
        style={styles.map}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#E5E7EB',
  },
  map: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
