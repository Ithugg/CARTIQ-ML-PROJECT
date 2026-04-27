import { Ionicons } from "@expo/vector-icons";
import { Camera, CameraView } from "expo-camera";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BorderRadius, Colors, Gradients, Shadows, Spacing, Typography } from "../../constants/theme";
import { CATEGORIES, getCategoryNames, mapIngredientToCategory } from "../../data/categories";
import { searchItems } from "../../data/items";
import { estimatePrice } from "../../data/prices";
import { useListsStore } from "../../stores/listsStore";
import type { GroceryItem } from "../../types";

export default function AddItemScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { listId } = useLocalSearchParams();
  const addItem = useListsStore((s) => s.addItem);

  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [scanningBarcode, setScanningBarcode] = useState(false);
  const [suggestions, setSuggestions] = useState<{ name: string; category: string }[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const categoryNames = getCategoryNames();

  const handleItemNameChange = (text: string) => {
    setItemName(text);

    if (text.length > 1) {
      const results = searchItems(text, 5);
      setSuggestions(results.map((r) => ({ name: r.name, category: r.category })));
    } else {
      setSuggestions([]);
    }

    const estimated = estimatePrice(text);
    if (estimated !== 3.5 || text.length > 3) {
      setPrice(estimated.toFixed(2));
    }
  };

  const handleSuggestionSelect = (item: { name: string; category: string }) => {
    setItemName(item.name);
    setCategory(item.category);
    setSuggestions([]);
    setPrice(estimatePrice(item.name).toFixed(2));
  };

  const mapCategoryToOurs = (apiCategories: string): string => {
    const matched = mapIngredientToCategory(apiCategories);
    return matched.name;
  };

  const lookupBarcodeFromAPI = async (barcode: string) => {
    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
      );
      const data = await response.json();

      if (data.status === 1 && data.product) {
        const cat = mapCategoryToOurs(data.product.categories || "");
        const estimated = estimatePrice(data.product.product_name || "", cat.toLowerCase());

        return {
          name: data.product.product_name || "Unknown Product",
          category: cat,
          price: estimated,
          barcode: barcode,
        };
      }
    } catch (error) {
      console.error("API lookup failed:", error);
    }
    return null;
  };

  const handleScanBarcode = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Camera permission is required to scan barcodes.");
      return;
    }
    setShowCamera(true);
    setScanningBarcode(false);
  };

  const handleBarCodeScanned = async ({ data }: { type: string; data: string }) => {
    setShowCamera(false);
    setScanningBarcode(true);

    try {
      const apiProduct = await lookupBarcodeFromAPI(data);

      if (apiProduct) {
        setItemName(apiProduct.name);
        setCategory(apiProduct.category);
        setPrice(apiProduct.price.toFixed(2));
        setScanningBarcode(false);

        Alert.alert(
          "Barcode Scanned!",
          `Product: ${apiProduct.name}\nCategory: ${apiProduct.category}\nEstimated Price: $${apiProduct.price.toFixed(2)}`
        );
      } else {
        setScanningBarcode(false);
        Alert.alert(
          "Product Not Found",
          `Barcode: ${data}\n\nThis product is not in our database. Please enter details manually.`
        );
      }
    } catch {
      setScanningBarcode(false);
      Alert.alert("Scan Error", "Failed to process barcode. Please try again or enter manually.");
    }
  };

  const handleAddItem = () => {
    if (!itemName.trim()) {
      Alert.alert("Error", "Please enter an item name");
      return;
    }

    const qty = parseInt(quantity);
    if (!qty || qty <= 0) {
      Alert.alert("Error", "Please enter a valid quantity greater than 0");
      return;
    }

    const finalCategory = category || mapIngredientToCategory(itemName).name;
    const itemPrice = parseFloat(price) || 0;

    if (!listId) {
      Alert.alert("Error", "No list selected");
      return;
    }

    addItem(listId as string, itemName, qty);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Alert.alert(
      "Item Added",
      `"${itemName}" added to your list.\nTotal: $${(itemPrice * qty).toFixed(2)}`,
      [
        {
          text: "Add Another",
          onPress: () => {
            setItemName("");
            setQuantity("1");
            setCategory("");
            setPrice("");
          },
        },
        { text: "Done", onPress: () => router.back() },
      ]
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    <View style={styles.container}>
      {/* Gradient Header */}
      <LinearGradient
        colors={Gradients.premiumDark}
        style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Item</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
      <ScrollView style={styles.contentScroll} keyboardShouldPersistTaps="handled">
        {/* Scan Section */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.scanSection}>
          <TouchableOpacity
            style={[styles.scanButton, (scanningBarcode || showCamera) && styles.scanButtonActive]}
            onPress={handleScanBarcode}
            disabled={scanningBarcode || showCamera}
            activeOpacity={0.7}
          >
            <View style={styles.scanIconWrap}>
              <Ionicons
                name="barcode-outline"
                size={28}
                color={scanningBarcode || showCamera ? Colors.neutral[400] : Colors.primary[600]}
              />
            </View>
            <View>
              <Text
                style={[
                  styles.scanButtonTitle,
                  (scanningBarcode || showCamera) && { color: Colors.neutral[400] },
                ]}
              >
                {showCamera ? "Camera Open..." : scanningBarcode ? "Processing..." : "Scan Barcode"}
              </Text>
              <Text style={styles.scanButtonSub}>Use your camera to scan product barcodes</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or enter manually</Text>
            <View style={styles.dividerLine} />
          </View>
        </Animated.View>

        {/* Form */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.form}>
          {/* Item Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Item Name *</Text>
            <View style={[
              styles.inputWrapper,
              focusedField === "name" && styles.inputWrapperFocused,
            ]}>
              <Ionicons
                name="search-outline"
                size={18}
                color={focusedField === "name" ? Colors.primary[500] : Colors.neutral[400]}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="e.g., Eggs, Milk, Bread"
                placeholderTextColor={Colors.neutral[400]}
                value={itemName}
                onChangeText={handleItemNameChange}
                onFocus={() => setFocusedField("name")}
                onBlur={() => setFocusedField(null)}
              />
            </View>
            {suggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {suggestions.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionItem}
                    onPress={() => handleSuggestionSelect(item)}
                  >
                    <Ionicons name="flash-outline" size={16} color={Colors.primary[500]} />
                    <Text style={styles.suggestionText}>{item.name}</Text>
                    <View style={styles.suggestionCatBadge}>
                      <Text style={styles.suggestionCategory}>{item.category}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Quantity & Price */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Quantity *</Text>
              <View style={[
                styles.inputWrapper,
                focusedField === "qty" && styles.inputWrapperFocused,
              ]}>
                <Ionicons
                  name="layers-outline"
                  size={18}
                  color={focusedField === "qty" ? Colors.primary[500] : Colors.neutral[400]}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="1"
                  placeholderTextColor={Colors.neutral[400]}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="number-pad"
                  onFocus={() => setFocusedField("qty")}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Price (per item)</Text>
              <View style={[
                styles.inputWrapper,
                focusedField === "price" && styles.inputWrapperFocused,
              ]}>
                <Text style={[
                  styles.dollarSign,
                  focusedField === "price" && { color: Colors.primary[500] },
                ]}>$</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor={Colors.neutral[400]}
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="decimal-pad"
                  onFocus={() => setFocusedField("price")}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>
          </View>

          {/* Total */}
          {price && quantity && parseFloat(price) > 0 && parseInt(quantity) > 0 && (
            <Animated.View entering={FadeInDown.duration(300)} style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Item Total:</Text>
              <Text style={styles.totalValue}>
                ${(parseFloat(price) * parseInt(quantity)).toFixed(2)}
              </Text>
            </Animated.View>
          )}

          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category *</Text>
            <TouchableOpacity
              style={[styles.categorySelector, Shadows.sm]}
              onPress={() => setShowCategoryModal(true)}
              activeOpacity={0.7}
            >
              <View style={styles.categorySelectorLeft}>
                <Ionicons
                  name="grid-outline"
                  size={18}
                  color={category ? Colors.primary[600] : Colors.neutral[400]}
                />
                <Text style={category ? styles.categoryText : styles.categoryPlaceholder}>
                  {category || "Select a category"}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={20} color={Colors.neutral[400]} />
            </TouchableOpacity>
          </View>

          {/* Add Button */}
          <TouchableOpacity style={styles.addButton} onPress={handleAddItem} activeOpacity={0.85}>
            <LinearGradient colors={Gradients.ctaPrimary} style={styles.addButtonGradient}>
              <Ionicons name="add-circle" size={22} color="#fff" />
              <Text style={styles.addButtonText}>Add to List</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Camera Modal */}
      <Modal visible={showCamera} animationType="slide" onRequestClose={() => setShowCamera(false)}>
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          onBarcodeScanned={showCamera ? handleBarCodeScanned : undefined}
          barcodeScannerSettings={{
            barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128", "qr"],
          }}
        />
        <View style={styles.cameraOverlayAbsolute}>
          <View style={styles.cameraHeader}>
            <TouchableOpacity onPress={() => setShowCamera(false)} style={styles.closeCameraButton}>
              <Ionicons name="close" size={32} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.scanArea}>
            <View style={styles.scanFrame} />
            <Text style={styles.scanText}>Point camera at barcode</Text>
            <Text style={styles.scanSubtext}>Align barcode within the frame</Text>
          </View>
        </View>
      </Modal>

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color={Colors.neutral[500]} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {categoryNames.map((cat, index) => {
                const catData = CATEGORIES[index];
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryOption,
                      category === cat && styles.categoryOptionSelected,
                    ]}
                    onPress={() => {
                      setCategory(cat);
                      setShowCategoryModal(false);
                    }}
                  >
                    <View style={styles.categoryOptionLeft}>
                      {catData && (
                        <View style={[styles.catIconWrap, { backgroundColor: catData.color + "20" }]}>
                          <Ionicons
                            name={catData.icon as any}
                            size={18}
                            color={catData.color}
                          />
                        </View>
                      )}
                      <Text style={styles.categoryOptionText}>{cat}</Text>
                    </View>
                    {category === cat && (
                      <Ionicons name="checkmark-circle" size={24} color={Colors.primary[600]} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    ...Typography.h2,
    color: "#fff",
  },

  contentScroll: {
    flex: 1,
  },

  // Scan Section
  scanSection: {
    padding: Spacing.xl,
    backgroundColor: Colors.neutral[0],
    marginBottom: Spacing.sm,
  },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary[50],
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: Colors.primary[200],
    borderStyle: "dashed",
    gap: Spacing.md,
  },
  scanButtonActive: {
    backgroundColor: Colors.neutral[100],
    borderColor: Colors.neutral[300],
  },
  scanIconWrap: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.neutral[0],
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.sm,
  },
  scanButtonTitle: {
    ...Typography.labelLg,
    color: Colors.primary[700],
  },
  scanButtonSub: {
    ...Typography.bodySm,
    color: Colors.neutral[500],
    marginTop: 2,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.neutral[200],
  },
  dividerText: {
    ...Typography.caption,
    color: Colors.neutral[400],
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Form
  form: {
    padding: Spacing.xl,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  row: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
    ...Typography.labelSm,
    color: Colors.neutral[600],
    marginBottom: Spacing.sm,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.neutral[0],
    borderWidth: 1.5,
    borderColor: Colors.neutral[200],
    borderRadius: BorderRadius.lg,
  },
  inputWrapperFocused: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.primary[50],
  },
  inputIcon: {
    paddingLeft: Spacing.md,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    ...Typography.bodyLg,
    color: Colors.neutral[800],
    minHeight: 48,
  },
  dollarSign: {
    ...Typography.labelLg,
    color: Colors.neutral[400],
    paddingLeft: Spacing.md,
  },

  // Suggestions
  suggestionsContainer: {
    backgroundColor: Colors.neutral[0],
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderTopWidth: 0,
    borderBottomLeftRadius: BorderRadius.lg,
    borderBottomRightRadius: BorderRadius.lg,
    marginTop: -4,
    ...Shadows.sm,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[100],
  },
  suggestionText: {
    flex: 1,
    ...Typography.bodyLg,
    color: Colors.neutral[700],
  },
  suggestionCatBadge: {
    backgroundColor: Colors.primary[50],
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  suggestionCategory: {
    ...Typography.caption,
    color: Colors.primary[600],
    fontWeight: "600",
  },

  // Total
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.primary[50],
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  totalLabel: {
    ...Typography.labelLg,
    color: Colors.neutral[700],
  },
  totalValue: {
    ...Typography.h2,
    color: Colors.primary[600],
  },

  // Category selector
  categorySelector: {
    backgroundColor: Colors.neutral[0],
    borderWidth: 1.5,
    borderColor: Colors.neutral[200],
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categorySelectorLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  categoryText: {
    ...Typography.bodyLg,
    color: Colors.neutral[800],
  },
  categoryPlaceholder: {
    ...Typography.bodyLg,
    color: Colors.neutral[400],
  },

  // Add button
  addButton: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    marginTop: Spacing.lg,
    ...Shadows.glow(Colors.primary[600]),
  },
  addButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  addButtonText: {
    color: "#fff",
    ...Typography.h3,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.neutral[0],
    borderTopLeftRadius: BorderRadius["2xl"],
    borderTopRightRadius: BorderRadius["2xl"],
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.neutral[800],
  },
  categoryOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  categoryOptionSelected: {
    backgroundColor: Colors.primary[50],
  },
  categoryOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  catIconWrap: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryOptionText: {
    ...Typography.bodyLg,
    color: Colors.neutral[700],
  },

  // Camera
  cameraOverlayAbsolute: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
  },
  cameraHeader: {
    paddingTop: 50,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  closeCameraButton: {
    alignSelf: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: BorderRadius["2xl"],
    padding: Spacing.sm,
  },
  scanArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: Colors.primary[400],
    borderRadius: BorderRadius.xl,
    backgroundColor: "transparent",
  },
  scanText: {
    marginTop: Spacing.xl,
    ...Typography.bodyLg,
    color: "#fff",
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  scanSubtext: {
    marginTop: Spacing.sm,
    ...Typography.bodyMd,
    color: "rgba(255,255,255,0.7)",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
});
