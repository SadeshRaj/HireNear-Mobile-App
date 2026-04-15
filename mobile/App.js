import './global.css';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
    return (
        <SafeAreaProvider>
            {/* The NavigationContainer MUST wrap your navigator! */}
            <NavigationContainer>
                <AppNavigator />
                <StatusBar style="dark" />
            </NavigationContainer>
        </SafeAreaProvider>
    );
}