import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { ArPreviewModal } from './src/features/ar/ArPreviewModal';
import { ArExperienceModal } from './src/features/ar/ArExperienceModal';
import { MobileAppView } from './src/features/app/MobileAppView';
import { useMobileAppController } from './src/features/app/useMobileAppController';
import { queryClient } from './src/state/queryClient';

function AppContent(): React.JSX.Element {
  const controller = useMobileAppController();

  return (
    <>
      <MobileAppView controller={controller} />
      <ArPreviewModal
        visible={controller.state.isArPreviewVisible}
        preview={controller.state.arPreview}
        themeMode={controller.state.themeMode}
        palette={controller.palette}
        onStartAr={() => {
          controller.setIsArPreviewVisible(false);
          controller.setIsArExperienceVisible(true);
        }}
        onClose={() => controller.setIsArPreviewVisible(false)}
      />
      <ArExperienceModal
        visible={controller.state.isArExperienceVisible}
        preview={controller.state.arPreview}
        palette={controller.palette}
        onClose={() => controller.setIsArExperienceVisible(false)}
        onSaveLayout={controller.handleSaveArLayout}
        isSaving={controller.isArSessionSaving}
        saveProgress={controller.arSessionSaveProgress}
        saveErrorMessage={controller.arSessionSaveError}
        saveSuccessMessage={controller.arSessionSaveSuccess}
      />
    </>
  );
}

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

export default App;
