import { Image, StyleSheet } from "react-native"
export default function AppLogo() {
    return(
        <>
            <Image
                source={require("@/assets/images/logoName.png")}
                style={styles.logo}
                accessibilityRole="image"
                accessibilityLabel="NutriVision logo"
              />
        </>
    )
}

const styles = StyleSheet.create({
    logo: {
    width: 200,
    height: 60,
    resizeMode: "contain",
    alignSelf: "flex-start",
    marginLeft: 5,
    marginBottom: -15
  },
})