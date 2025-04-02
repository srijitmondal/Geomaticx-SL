// import React, { useState, useEffect, useRef } from 'react';
// import { View, StyleSheet, Text, ActivityIndicator, Platform } from 'react-native';
// import { useLocalSearchParams } from 'expo-router';
// import { MapPin } from 'lucide-react-native';

// // Only import react-native-maps if not on web
// let MapView: any;
// let Marker: any;
// let Polyline: any;
// let PROVIDER_GOOGLE: any;

// if (Platform.OS !== 'web') {
//   const maps = require('react-native-maps');
//   MapView = maps.MapView;
//   Marker = maps.Marker;
//   Polyline = maps.Polyline;
//   PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
// }

// // Types for our tracking data
// interface TrackingData {
//   attn_id: string;
//   lat: number;
//   long: number;
//   timestamp: string;
//   u_fname: string;
//   u_lname: string;
//   u_pro_img: string;
// }

// interface Region {
//   latitude: number;
//   longitude: number;
//   latitudeDelta: number;
//   longitudeDelta: number;
// }

// export default function Monitoring() {
//   const { attn_id } = useLocalSearchParams();
//   const [trackingData, setTrackingData] = useState<TrackingData[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const mapRef = useRef<any>(null);

//   // Initial region (will be updated when data loads)
//   const [region, setRegion] = useState<Region>({
//     latitude: 0,
//     longitude: 0,
//     latitudeDelta: 0.0922,
//     longitudeDelta: 0.0421,
//   });

//   const fetchTrackingData = async () => {
//     try {
//       const response = await fetch(`http://localhost/user_tracking.php?attn_id=${attn_id}`);
//       if (!response.ok) {
//         throw new Error('Failed to fetch tracking data');
//       }
//       const data = await response.json();
      
//       if (Array.isArray(data) && data.length > 0) {
//         setTrackingData(data);
        
//         // Calculate the center point and set initial region
//         const bounds = data.reduce(
//           (acc, point) => ({
//             minLat: Math.min(acc.minLat, point.lat),
//             maxLat: Math.max(acc.maxLat, point.lat),
//             minLng: Math.min(acc.minLng, point.long),
//             maxLng: Math.max(acc.maxLng, point.long),
//           }),
//           {
//             minLat: Number.MAX_VALUE,
//             maxLat: Number.MIN_VALUE,
//             minLng: Number.MAX_VALUE,
//             maxLng: Number.MIN_VALUE,
//           }
//         );

//         const centerLat = (bounds.minLat + bounds.maxLat) / 2;
//         const centerLng = (bounds.minLng + bounds.maxLng) / 2;
//         const latDelta = (bounds.maxLat - bounds.minLat) * 1.5;
//         const lngDelta = (bounds.maxLng - bounds.minLng) * 1.5;

//         setRegion({
//           latitude: centerLat,
//           longitude: centerLng,
//           latitudeDelta: latDelta,
//           longitudeDelta: lngDelta,
//         });
//       }
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'An error occurred');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchTrackingData();
//     // Fetch new data every 30 seconds
//     const interval = setInterval(fetchTrackingData, 30000);
//     return () => clearInterval(interval);
//   }, [attn_id]);

//   if (loading) {
//     return (
//       <View style={styles.centered}>
//         <ActivityIndicator size="large" color="#0000ff" />
//         <Text style={styles.loadingText}>Loading tracking data...</Text>
//       </View>
//     );
//   }

//   if (error) {
//     return (
//       <View style={styles.centered}>
//         <Text style={styles.errorText}>{error}</Text>
//       </View>
//     );
//   }

//   if (!trackingData.length) {
//     return (
//       <View style={styles.centered}>
//         <Text style={styles.errorText}>No tracking data available</Text>
//       </View>
//     );
//   }

//   const coordinates = trackingData.map(point => ({
//     latitude: parseFloat(point.lat.toString()),
//     longitude: parseFloat(point.long.toString()),
//   }));

//   // Return a simple view for web platform
//   if (Platform.OS === 'web') {
//     return (
//       <View style={styles.centered}>
//         <Text style={styles.errorText}>Map view is not supported on web platform</Text>
//         <Text>Tracking Data:</Text>
//         {trackingData.map((point, index) => (
//           <Text key={`${point.timestamp}-${index}`}>
//             {point.u_fname} {point.u_lname} at {point.lat}, {point.long} ({new Date(point.timestamp).toLocaleString()})
//           </Text>
//         ))}
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <MapView
//         ref={mapRef}
//         style={styles.map}
//         provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
//         initialRegion={region}
//         showsUserLocation
//         showsMyLocationButton
//         showsCompass
//         showsScale
//       >
//         {trackingData.map((point, index) => (
//           <Marker
//             key={`${point.timestamp}-${index}`}
//             coordinate={{
//               latitude: parseFloat(point.lat.toString()),
//               longitude: parseFloat(point.long.toString()),
//             }}
//             title={`${point.u_fname} ${point.u_lname}`}
//             description={new Date(point.timestamp).toLocaleString()}
//           >
//             <MapPin
//               size={24}
//               color={index === 0 ? '#4CAF50' : index === trackingData.length - 1 ? '#F44336' : '#2196F3'}
//             />
//           </Marker>
//         ))}
        
//         <Polyline
//           coordinates={coordinates}
//           strokeColor="#2196F3"
//           strokeWidth={3}
//         />
//       </MapView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   map: {
//     flex: 1,
//   },
//   centered: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   loadingText: {
//     marginTop: 10,
//     fontSize: 16,
//     color: '#666',
//   },
//   errorText: {
//     fontSize: 16,
//     color: '#F44336',
//     textAlign: 'center',
//   },
// });