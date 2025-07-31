import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ImageSourcePropType,
  StyleSheet,
} from "react-native";

interface NutrientInputRowProps {
  iconSource: ImageSourcePropType;
  label: string;
  value: number;
  isEditing: boolean;
  onEdit: () => void;
  onChangeText: (text: string) => void;
}

interface Nutrients {
  carbohydrate: string;
  sodium: string;
  protein: string;
}

interface IsEditing {
  carbohydrate: boolean;
  sodium: boolean;
  protein: boolean;
}

interface NutrientInputSectionProps {
  nutrients: Nutrients;
  isEditing: IsEditing;
  handleNutrientChange: (nutrient: keyof Nutrients, text: string) => void;
  toggleEdit: (nutrient: keyof Nutrients) => void;
}

const NutrientInputRow: React.FC<NutrientInputRowProps> = ({
  iconSource,
  label,
  value,
  isEditing,
  onEdit,
  onChangeText,
}) => (
  <View style={styles.inputRow}>
    <Image source={iconSource} style={styles.icon} />
    <Text style={styles.nutrientText}>{label}</Text>
    <View style={styles.divider} />
    <View style={styles.inputBox}>
      {isEditing ? (
        <TextInput
          style={styles.input}
          value={value.toString()}
          onChangeText={onChangeText}
          autoFocus
          onBlur={onEdit}
          keyboardType="decimal-pad"
          textAlign="center"
        />
      ) : (
        <>
          <Text style={styles.inputText}>{value}</Text>
          <TouchableOpacity style={styles.editButtonInside} onPress={onEdit}>
            <Image
              source={require("@/assets/images/Edit Icon.png")}
              style={styles.editIcon}
            />
          </TouchableOpacity>
        </>
      )}
    </View>
  </View>
);

const NutrientInputSection: React.FC<NutrientInputSectionProps> = ({
  nutrients,
  isEditing,
  handleNutrientChange,
  toggleEdit,
}) => {
  const nutrientData: Array<{
    key: keyof Nutrients;
    label: string;
    iconSource: ImageSourcePropType;
  }> = [
    {
      key: "carbohydrate",
      label: "Carbs",
      iconSource: require("@/assets/images/Carbohydrate Icon.png"),
    },
    {
      key: "sodium",
      label: "Sodium",
      iconSource: require("@/assets/images/Sodium Icon.png"),
    },
    {
      key: "protein",
      label: "Protein",
      iconSource: require("@/assets/images/Protein Icon.png"),
    },
  ];

  return (
    <View style={styles.inputSection}>
      {nutrientData.map(({ key, label, iconSource }) => (
        <NutrientInputRow
          key={key}
          iconSource={iconSource}
          label={label}
          value={Number(nutrients[key])}
          isEditing={isEditing[key]}
          onEdit={() => toggleEdit(key)}
          onChangeText={(text) => handleNutrientChange(key, text)}
        />
      ))}
    </View>
  );
};

export default NutrientInputSection;

const styles = StyleSheet.create({
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 7.5,
    marginHorizontal: 8,
    overflow: "hidden",
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  nutrientText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4D4444",
  },
  editIcon: {
    width: 13,
    height: 13,
  },
  editButtonInside: {
    position: "absolute",
    right: 5,
    top: "50%",
    transform: [{ translateY: -8 }], // Center vertically (half of icon height)
  },
  inputBox: {
    backgroundColor: "#F0F0F0",
    borderRadius: 8,
    width: 90,
    height: 40,
    justifyContent: "center",
    position: "relative", // Added to position the edit icon inside
  },
  inputText: {
    fontSize: 14,
    color: "#333",
    textAlign: "center",
  },
  input: {
    width: "100%",
    height: "100%",
    fontSize: 14,
    color: "#333",
    padding: 0,
    textAlign: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "#DDDDDD",
    flex: 1, // Makes it take up available space
    marginHorizontal: 10,
  },
  inputSection: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 20,
  },
});
