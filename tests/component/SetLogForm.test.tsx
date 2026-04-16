jest.mock('../../src/services/set-service', () => ({
  getLastSetForExercise: jest.fn().mockResolvedValue({
    weight: 80,
    reps: 10,
    rir: 2,
  }),
}));

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import SetLogForm from '../../src/components/SetLogForm';
import type { Exercise } from '../../src/models/exercise';

const mockExercise: Exercise = {
  id: 'e1',
  name: 'Barbell Bench Press',
  muscleGroup: 'chest',
  isBuiltIn: true,
  isFavorite: false,
  createdAt: new Date().toISOString(),
};

describe('SetLogForm', () => {
  it('renders the exercise name', () => {
    const { getByText } = render(
      <SetLogForm
        exercise={mockExercise}
        onLog={jest.fn()}
        onChangeExercise={jest.fn()}
      />,
    );
    expect(getByText('Barbell Bench Press')).toBeTruthy();
  });

  it('shows the Log Set button', () => {
    const { getByText } = render(
      <SetLogForm
        exercise={mockExercise}
        onLog={jest.fn()}
        onChangeExercise={jest.fn()}
      />,
    );
    expect(getByText('Log Set')).toBeTruthy();
  });

  it('shows pre-fill note after loading last set', async () => {
    const { getByText } = render(
      <SetLogForm
        exercise={mockExercise}
        onLog={jest.fn()}
        onChangeExercise={jest.fn()}
      />,
    );
    await waitFor(() => {
      expect(getByText('Pre-filled from last session')).toBeTruthy();
    });
  });
});
