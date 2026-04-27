import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Share as RNShare,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { BorderRadius, Colors, Shadows, Spacing, Typography } from "../../constants/theme";

interface Collaborator {
  id: string;
  name: string;
  email: string;
  permission: "edit" | "view";
  status: "active" | "pending";
}

export default function ShareListScreen() {
  const router = useRouter();
  const [listName] = useState("Weekly Groceries");
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<"edit" | "view">("edit");
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);

  const handleSendInvite = () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter an email address");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }
    if (collaborators.some((c) => c.email === email)) {
      Alert.alert("Error", "This user has already been invited");
      return;
    }
    const newCollaborator: Collaborator = {
      id: Date.now().toString(),
      name: email.split("@")[0],
      email,
      permission,
      status: "pending",
    };
    setCollaborators([...collaborators, newCollaborator]);
    setEmail("");
    Alert.alert("Invite Sent", `Invitation sent to ${email}`);
  };

  const handleShareLink = async () => {
    try {
      const shareLink = `https://cartiq.app/lists/invite/${listName.replace(/\s+/g, "-").toLowerCase()}`;
      await RNShare.share({
        message: `Join my CartIQ grocery list "${listName}"! ${shareLink}`,
        title: "Share Grocery List",
      });
    } catch {
      Alert.alert("Error", "Failed to share link");
    }
  };

  const handleChangePermission = (id: string) => {
    Alert.alert("Change Permission", "Select permission level:", [
      {
        text: "Can Edit",
        onPress: () => setCollaborators(collaborators.map((c) => (c.id === id ? { ...c, permission: "edit" } : c))),
      },
      {
        text: "Can View Only",
        onPress: () => setCollaborators(collaborators.map((c) => (c.id === id ? { ...c, permission: "view" } : c))),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleRemoveCollaborator = (id: string, name: string) => {
    Alert.alert("Remove Collaborator", `Remove ${name} from this list?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          setCollaborators(collaborators.filter((c) => c.id !== id));
          Alert.alert("Removed", `${name} has been removed from the list`);
        },
      },
    ]);
  };

  const handleResendInvite = (emailAddr: string) => {
    Alert.alert("Resent", `Invitation resent to ${emailAddr}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.neutral[800]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Share List</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.listInfo}>
          <View style={styles.listIconContainer}>
            <Ionicons name="list" size={28} color={Colors.primary[600]} />
          </View>
          <Text style={styles.listName}>{listName}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invite by Email</Text>
          <View style={styles.inviteForm}>
            <TextInput
              style={styles.emailInput}
              placeholder="colleague@example.com"
              placeholderTextColor={Colors.neutral[400]}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={styles.permissionSelector}>
              <TouchableOpacity
                style={[styles.permissionOption, permission === "edit" && styles.permissionOptionActive]}
                onPress={() => setPermission("edit")}
              >
                <Ionicons
                  name={permission === "edit" ? "radio-button-on" : "radio-button-off"}
                  size={20}
                  color={permission === "edit" ? Colors.primary[600] : Colors.neutral[400]}
                />
                <Text style={styles.permissionText}>Can Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.permissionOption, permission === "view" && styles.permissionOptionActive]}
                onPress={() => setPermission("view")}
              >
                <Ionicons
                  name={permission === "view" ? "radio-button-on" : "radio-button-off"}
                  size={20}
                  color={permission === "view" ? Colors.primary[600] : Colors.neutral[400]}
                />
                <Text style={styles.permissionText}>View Only</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.sendButton} onPress={handleSendInvite}>
              <Ionicons name="send" size={20} color={Colors.neutral[0]} />
              <Text style={styles.sendButtonText}>Send Invite</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity style={styles.shareLinkButton} onPress={handleShareLink}>
          <Ionicons name="link" size={24} color={Colors.primary[600]} />
          <Text style={styles.shareLinkText}>Share Link</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Collaborators ({collaborators.length})</Text>
          {collaborators.map((collaborator) => (
            <View key={collaborator.id} style={styles.collaboratorCard}>
              <View style={styles.collaboratorInfo}>
                <View style={styles.avatarCircle}>
                  <Ionicons name="person" size={24} color={Colors.neutral[500]} />
                </View>
                <View style={styles.collaboratorDetails}>
                  <Text style={styles.collaboratorName}>{collaborator.name}</Text>
                  <Text style={styles.collaboratorEmail}>{collaborator.email}</Text>
                </View>
              </View>
              <View style={styles.collaboratorActions}>
                <View style={styles.statusContainer}>
                  {collaborator.status === "pending" ? (
                    <>
                      <View style={styles.pendingBadge}>
                        <Text style={styles.pendingText}>Pending</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleResendInvite(collaborator.email)}
                        style={styles.resendButton}
                      >
                        <Ionicons name="refresh" size={20} color={Colors.primary[600]} />
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity
                      onPress={() => handleChangePermission(collaborator.id)}
                      style={styles.permissionBadge}
                    >
                      <Text style={styles.permissionBadgeText}>
                        {collaborator.permission === "edit" ? "Can Edit" : "View Only"}
                      </Text>
                      <Ionicons name="chevron-down" size={16} color={Colors.neutral[700]} />
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => handleRemoveCollaborator(collaborator.id, collaborator.name)}
                >
                  <Ionicons name="close-circle" size={24} color={Colors.danger[500]} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={Colors.accent[600]} />
          <Text style={styles.infoText}>
            Changes made by you or collaborators will sync in real-time for everyone.
          </Text>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: 50,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  backButton: {
    marginRight: Spacing.lg,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.neutral[800],
  },
  content: {
    flex: 1,
  },
  listInfo: {
    backgroundColor: Colors.primary[50],
    padding: Spacing.xl,
    alignItems: "center",
    gap: Spacing.md,
  },
  listIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.neutral[0],
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.sm,
  },
  listName: {
    ...Typography.h2,
    color: Colors.neutral[800],
  },
  section: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.neutral[800],
    marginBottom: Spacing.lg,
  },
  inviteForm: {
    gap: Spacing.lg,
  },
  emailInput: {
    backgroundColor: Colors.neutral[0],
    borderWidth: 1.5,
    borderColor: Colors.neutral[300],
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Typography.bodyLg,
    color: Colors.neutral[800],
  },
  permissionSelector: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  permissionOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.neutral[0],
    borderWidth: 1.5,
    borderColor: Colors.neutral[300],
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  permissionOptionActive: {
    borderColor: Colors.primary[600],
    backgroundColor: Colors.primary[50],
  },
  permissionText: {
    ...Typography.bodyMd,
    color: Colors.neutral[700],
  },
  sendButton: {
    backgroundColor: Colors.primary[600],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  sendButtonText: {
    color: Colors.neutral[0],
    ...Typography.labelLg,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.neutral[200],
  },
  dividerText: {
    marginHorizontal: Spacing.lg,
    ...Typography.bodyMd,
    color: Colors.neutral[500],
  },
  shareLinkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.neutral[0],
    marginHorizontal: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.primary[600],
    gap: Spacing.sm,
  },
  shareLinkText: {
    ...Typography.labelLg,
    color: Colors.primary[600],
  },
  collaboratorCard: {
    backgroundColor: Colors.neutral[0],
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    ...Shadows.sm,
  },
  collaboratorInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.neutral[200],
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  collaboratorDetails: {
    flex: 1,
  },
  collaboratorName: {
    ...Typography.labelLg,
    color: Colors.neutral[800],
    marginBottom: Spacing.xs,
  },
  collaboratorEmail: {
    ...Typography.bodyMd,
    color: Colors.neutral[500],
  },
  collaboratorActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  pendingBadge: {
    backgroundColor: Colors.warning[100],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  pendingText: {
    ...Typography.labelSm,
    color: Colors.warning[600],
  },
  resendButton: {
    padding: Spacing.xs,
  },
  permissionBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary[50],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  permissionBadgeText: {
    ...Typography.labelSm,
    color: Colors.neutral[700],
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: Colors.accent[100],
    margin: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  infoText: {
    flex: 1,
    ...Typography.bodyMd,
    color: Colors.accent[600],
    lineHeight: 20,
  },
});
