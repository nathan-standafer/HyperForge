import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import WeightStepper from '../../src/components/WeightStepper';

describe('WeightStepper', () => {
  it('displays the current weight value', () => {
    const { getByText } = render(
      <WeightStepper value={80} onChange={jest.fn()} />,
    );
    expect(getByText('80')).toBeTruthy();
  });

  it('displays BW for zero weight', () => {
    const { getByText } = render(
      <WeightStepper value={0} onChange={jest.fn()} />,
    );
    expect(getByText('BW')).toBeTruthy();
  });

  it('increments weight by step amount on + press', () => {
    const onChange = jest.fn();
    const { getByText } = render(
      <WeightStepper value={80} onChange={onChange} step={2.5} />,
    );
    fireEvent.press(getByText('+2.5'));
    expect(onChange).toHaveBeenCalledWith(82.5);
  });

  it('decrements weight by step amount on - press', () => {
    const onChange = jest.fn();
    const { getByText } = render(
      <WeightStepper value={80} onChange={onChange} step={2.5} />,
    );
    fireEvent.press(getByText('−2.5'));
    expect(onChange).toHaveBeenCalledWith(77.5);
  });

  it('does not go below zero', () => {
    const onChange = jest.fn();
    const { getByText } = render(
      <WeightStepper value={1} onChange={onChange} step={2.5} />,
    );
    fireEvent.press(getByText('−2.5'));
    expect(onChange).toHaveBeenCalledWith(0);
  });
});
