// Basic React Native App to Connect to a Smart Trainer using Bluetooth

import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, StyleSheet } from 'react-native';
import { BleManager } from 'react-native-ble-plx';

const App = () => {
  const [bleManager] = useState(new BleManager());
  const [devices, setDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [trainerData, setTrainerData] = useState(null);

  // Start scanning for devices
  const startScan = () => {
    setDevices([]); // Reset device list
    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error('Scan Error:', error);
        return;
      }

      // Add device to the list if not already added
      if (device && device.name && !devices.find(d => d.id === device.id)) {
        setDevices(prevDevices => [...prevDevices, device]);
      }
    });
  };

  // Connect to a specific device
  const connectToDevice = async (device) => {
    try {
      const connectedDevice = await bleManager.connectToDevice(device.id);
      setConnectedDevice(connectedDevice);
      bleManager.stopDeviceScan(); // Stop scanning once connected

      // Discover services and characteristics
      await connectedDevice.discoverAllServicesAndCharacteristics();
      console.log('Connected to:', connectedDevice.name);

      // Assume trainer data is available on a specific characteristic (customize as needed)
      const services = await connectedDevice.services();
      for (const service of services) {
        const characteristics = await service.characteristics();
        for (const characteristic of characteristics) {
          if (characteristic.isNotifiable) {
            characteristic.monitor((error, characteristic) => {
              if (error) {
                console.error('Monitor Error:', error);
                return;
              }
              if (characteristic.value) {
                const value = Buffer.from(characteristic.value, 'base64').toString('utf8');
                setTrainerData(value);
              }
            });
          }
        }
      }
    } catch (error) {
      console.error('Connection Error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Smart Trainer App</Text>

      {!connectedDevice ? (
        <>
          <Button title="Start Scan" onPress={startScan} />
          <FlatList
            data={devices}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Button
                title={`Connect to ${item.name}`}
                onPress={() => connectToDevice(item)}
              />
            )}
          />
        </>
      ) : (
        <>
          <Text>Connected to: {connectedDevice.name}</Text>
          <Text>Trainer Data: {trainerData}</Text>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

export default App;
