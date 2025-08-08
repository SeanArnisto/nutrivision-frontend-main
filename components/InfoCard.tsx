import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InfoCardProps {
  title: string;
  subtitle?: string;
  value?: string;
  editable?: boolean;
  onEdit?: () => void;
  style?: object;
  backgroundColor?: string;
}

export default function InfoCard({
  title,
  subtitle,
  value,
  editable = false,
  onEdit,
  style,
  backgroundColor = '#F5F5F5',
}: InfoCardProps) {
  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && (
          <Text style={styles.subtitle}>{subtitle}</Text>
        )}
        {value && (
          <Text style={styles.value}>{value}</Text>
        )}
      </View>
      
      {editable && (
        <TouchableOpacity onPress={onEdit} style={styles.editButton}>
          <Ionicons name="pencil" size={20} color="#9AB106" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    fontFamily: 'AlbertSans-Regular',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9AB106',
    marginBottom: 2,
    fontFamily: 'AlbertSans-SemiBold',
  },
  value: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'AlbertSans-Regular',
  },
  editButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(154, 177, 6, 0.1)',
  },
});