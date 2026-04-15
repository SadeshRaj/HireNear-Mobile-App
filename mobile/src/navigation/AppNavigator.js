import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import WorkerHomeScreen from "../screens/WorkerHomeScreen";
import ViewJobsScreen from "../screens/ViewJobsScreen";
import PlaceBidScreen from "../screens/PlaceBidScreen";
import MyBidsScreen from "../screens/MyBidsScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="WorkerHome">
        <Stack.Screen
          name="WorkerHome"
          component={WorkerHomeScreen}
          options={{ title: "Worker Dashboard" }}
        />
        <Stack.Screen
          name="ViewJobs"
          component={ViewJobsScreen}
          options={{ title: "Available Jobs" }}
        />
        <Stack.Screen
          name="PlaceBid"
          component={PlaceBidScreen}
          options={{ title: "Place Bid" }}
        />
        <Stack.Screen
          name="MyBids"
          component={MyBidsScreen}
          options={{ title: "My Bids" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}