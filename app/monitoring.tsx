// import React, { useEffect, useState } from 'react';
// import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
// import MapView, { Marker, Polyline } from 'react-native-maps';
// import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
// import data from './data.json'; // Import the local JSON file

// // Define the type for tracking data
// interface TrackingData {
//     attn_id: string;
//     lat: string;
//     long: string;
//     timestamp: string;
//     u_fname: string;
//     u_lname: string;
//     u_pro_img: string;
// }

// const Monitoring = () => {
//     // Initialize state with the correct type
//     const [trackingData, setTrackingData] = useState<TrackingData[]>([]);
//     const [loading, setLoading] = useState(true);
//     const navigation = useNavigation();
//     interface RouteParams {
//         attn_id: string;
//     }
    
//     const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();

//     const { attn_id } = route.params;

//     useEffect(() => {
//         // Simulate fetching data from the local JSON file
//         const fetchTrackingData = () => {
//             try {
//                 // Filter data based on attn_id (if needed)
//                 const filteredData = data.filter((item: TrackingData) => item.attn_id === attn_id);
//                 setTrackingData(filteredData);
//                 setLoading(false);
//             } catch (error) {
//                 console.error('Error fetching tracking data:', error);
//                 setLoading(false);
//             }
//         };

//         fetchTrackingData();
//     }, [attn_id]);

//     if (loading) {
//         return (
//             <View style={styles.loadingContainer}>
//                 <ActivityIndicator size="large" color="#0000ff" />
//             </View>
//         );
//     }

//     if (trackingData.length === 0) {
//         return (
//             <View style={styles.container}>
//                 <Text>No tracking data available</Text>
//             </View>
//         );
//     }

//     const initialRegion = {
//         latitude: parseFloat(trackingData[0].lat),
//         longitude: parseFloat(trackingData[0].long),
//         latitudeDelta: 0.0922,
//         longitudeDelta: 0.0421,
//     };

//     const travelPath = trackingData.map(data => ({
//         latitude: parseFloat(data.lat),
//         longitude: parseFloat(data.long),
//     }));

//     return (
//         <View style={styles.container}>
//             <MapView
//                 style={styles.map}
//                 initialRegion={initialRegion}
//                 provider="google"
//             >
//                 {trackingData.map((data, index) => (
//                     <Marker
//                         key={index}
//                         coordinate={{
//                             latitude: parseFloat(data.lat),
//                             longitude: parseFloat(data.long),
//                         }}
//                         title={`${data.u_fname} ${data.u_lname}`}
//                         description={`Time: ${data.timestamp}`}
//                         icon={
//                             index === 0
//                                 ? require('./assets/green-dot.png')
//                                 : index === trackingData.length - 1
//                                 ? require('./assets/red-dot.png')
//                                 : require('./assets/blue-dot.png')
//                         }
//                     />
//                 ))}
//                 <Polyline
//                     coordinates={travelPath}
//                     strokeColor="#ff0000"
//                     strokeWidth={3}
//                 />
//             </MapView>
//             <ScrollView style={styles.sidebar}>
//                 <Text style={styles.sidebarTitle}>Travel History</Text>
//                 {trackingData.map((data, index) => (
//                     <View key={index} style={styles.travelItem}>
//                         <Text style={styles.travelTime}>{data.timestamp}</Text>
//                         <Text>Lat: {data.lat}, Long: {data.long}</Text>
//                     </View>
//                 ))}
//             </ScrollView>
//         </View>
//     );
// };

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         flexDirection: 'row',
//     },
//     map: {
//         width: '75%',
//         height: '100%',
//     },
//     sidebar: {
//         width: '25%',
//         height: '100%',
//         backgroundColor: '#f8f9fa',
//         borderLeftWidth: 1,
//         borderLeftColor: '#ddd',
//         padding: 15,
//     },
//     sidebarTitle: {
//         fontSize: 18,
//         fontWeight: 'bold',
//         marginBottom: 10,
//     },
//     travelItem: {
//         marginBottom: 10,
//         padding: 10,
//         backgroundColor: '#fff',
//         borderRadius: 5,
//         borderWidth: 1,
//         borderColor: '#ddd',
//     },
//     travelTime: {
//         fontWeight: 'bold',
//     },
//     loadingContainer: {
//         flex: 1,
//         justifyContent: 'center',
//         alignItems: 'center',
//     },
// });

// export default Monitoring;