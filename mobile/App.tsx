import { StatusBar } from "expo-status-bar"
import { NavigationContainer } from "@react-navigation/native"
import { Provider as ReduxProvider } from "react-redux"
import { PaperProvider } from "react-native-paper"
import { SafeAreaProvider } from "react-native-safe-area-context"
import RootNavigator from "./src/navigation/RootNavigator"
import { store } from "./src/store/store"
import { theme } from "./src/theme/theme"

export default function App() {
    return (
        <SafeAreaProvider>
            <ReduxProvider store={store}>
                <PaperProvider theme={theme}>
                    <NavigationContainer>
                        <RootNavigator />
                    </NavigationContainer>
                    <StatusBar style="dark" />
                </PaperProvider>
            </ReduxProvider>
        </SafeAreaProvider>
    )
}