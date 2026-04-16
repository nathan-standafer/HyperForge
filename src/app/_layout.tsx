import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Text } from 'react-native';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#2563eb',
          headerStyle: { backgroundColor: '#f8fafc' },
          headerTitleStyle: { fontWeight: '700' },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Workout',
            tabBarIcon: ({ color }) => (
              <Text style={{ color, fontSize: 20 }}>🏋️</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="history/index"
          options={{
            title: 'History',
            tabBarIcon: ({ color }) => (
              <Text style={{ color, fontSize: 20 }}>📋</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="progress/index"
          options={{
            title: 'Progress',
            tabBarIcon: ({ color }) => (
              <Text style={{ color, fontSize: 20 }}>📈</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="exercise-select"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="history/[id]"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="progress/exercise/[id]"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="progress/prs/[exerciseId]"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </>
  );
}
