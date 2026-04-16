import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
} from 'react-native';

interface WeightStepperProps {
  value: number;
  onChange: (value: number) => void;
  step?: number;
}

export default function WeightStepper({
  value,
  onChange,
  step = 2.5,
}: WeightStepperProps) {
  const [showKeypad, setShowKeypad] = useState(false);
  const [keypadValue, setKeypadValue] = useState('');

  const decrement = () => {
    const next = Math.max(0, value - step);
    onChange(next);
  };

  const increment = () => {
    onChange(value + step);
  };

  const openKeypad = () => {
    setKeypadValue(String(value));
    setShowKeypad(true);
  };

  const confirmKeypad = () => {
    const parsed = parseFloat(keypadValue);
    if (!isNaN(parsed) && parsed >= 0) {
      onChange(parsed);
    }
    setShowKeypad(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={decrement}
        accessibilityLabel={`Decrease weight by ${step}`}
      >
        <Text style={styles.buttonText}>−{step}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.valueContainer}
        onPress={openKeypad}
        accessibilityLabel="Tap to enter weight manually"
      >
        <Text style={styles.value}>
          {value === 0 ? 'BW' : value}
        </Text>
        <Text style={styles.unit}>kg</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={increment}
        accessibilityLabel={`Increase weight by ${step}`}
      >
        <Text style={styles.buttonText}>+{step}</Text>
      </TouchableOpacity>

      <Modal visible={showKeypad} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Weight (kg)</Text>
            <TextInput
              style={styles.input}
              value={keypadValue}
              onChangeText={setKeypadValue}
              keyboardType="decimal-pad"
              autoFocus
              selectTextOnFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowKeypad(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmKeypad}
              >
                <Text style={styles.confirmText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  button: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    minWidth: 64,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
  valueContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 80,
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
  },
  unit: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: 280,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#2563eb',
  },
  cancelText: {
    fontSize: 16,
    color: '#64748b',
  },
  confirmText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});
