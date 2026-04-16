import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { TemplateForm } from '../../components/TemplateForm';
import {
  createTemplate,
  type CreateTemplateInput,
} from '../../services/template-service';

export default function CreateTemplateScreen() {
  const router = useRouter();

  const handleSave = async (input: CreateTemplateInput) => {
    await createTemplate(input);
    router.back();
  };

  return (
    <>
      <Stack.Screen options={{ title: 'New Template' }} />
      <TemplateForm onSave={handleSave} onCancel={() => router.back()} />
    </>
  );
}
