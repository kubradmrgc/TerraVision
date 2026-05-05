import React from 'react';
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
        onStartAr={() => {
          controller.setIsArPreviewVisible(false);
          controller.setIsArExperienceVisible(true);
        }}
        onClose={() => controller.setIsArPreviewVisible(false)}
      />
      <ArExperienceModal
        visible={controller.state.isArExperienceVisible}
        preview={controller.state.arPreview}
        onClose={() => controller.setIsArExperienceVisible(false)}
      />
    </>
  );
}

function App(): React.JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
