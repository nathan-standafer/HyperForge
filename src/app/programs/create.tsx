import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { ProgramForm } from '../../components/ProgramForm';
import {
  createProgram,
  type CreateProgramInput,
} from '../../services/program-service';

export default function CreateProgramScreen() {
  const router = useRouter();

  const handleSave = async (input: CreateProgramInput) => {
    await createProgram(input);
    router.back();
  };

  return (
    <>
      <Stack.Screen options={{ title: 'New Program' }} />
      <ProgramForm onSave={handleSave} onCancel={() => router.back()} />
    </>
  );
}
