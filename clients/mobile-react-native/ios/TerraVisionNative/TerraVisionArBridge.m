#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(TerraVisionAr, NSObject)

RCT_EXTERN_METHOD(launchArSession:(NSString *)modelUrl
                  modelFormat:(NSString *)modelFormat
                  placementHint:(NSString *)placementHint
                  suggestedScale:(nonnull NSNumber *)suggestedScale
                  productTitle:(NSString *)productTitle
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

@end
