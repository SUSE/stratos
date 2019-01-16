import { NgModule } from '@angular/core';
import { Router } from '@angular/router';

import { CoreModule } from '../core/core.module';
import { Customizations, CustomizationsMetadata } from '../core/customizations.types';
import { MDAppModule } from '../core/md.module';
import { SharedModule } from '../shared/shared.module';
import { KubernetesSetupModule } from './kubernetes/kubernetes.setup.module';
import { CaaspSetupModule } from './caasp/caasp.setup.module';
import { SuseLoginComponent } from './suse-login/suse-login.component';
import { EndpointsService } from '../core/endpoints.service';
import { Store } from '@ngrx/store';
import { AppState } from '../store/app-state';
import { KubeHealthCheck } from './kubernetes/store/kubernetes.actions';
import { EndpointHealthCheck } from '../core/endpoints-health-checks';

const SuseCustomizations: CustomizationsMetadata = {
  copyright: '&copy; 2018 SUSE',
  hasEula: true,
};

@NgModule({
  imports: [
    CoreModule,
    SharedModule,
    MDAppModule,
    KubernetesSetupModule,
    CaaspSetupModule,
  ],
  declarations: [
    SuseLoginComponent
  ],
  entryComponents: [
    SuseLoginComponent,
  ],
  providers: [
    { provide: Customizations, useValue: SuseCustomizations }
  ],
})
export class CustomModule {

  static init = false;

  constructor(endpointService: EndpointsService, store: Store<AppState>, router: Router) {
    endpointService.registerHealthCheck(
      new EndpointHealthCheck('k8s', (endpoint) => store.dispatch(new KubeHealthCheck(endpoint.guid)))
    );
    // Only update the routes once
    if (!CustomModule.init) {
      // Override the component used for the login route
      const routeConfig = [...router.config];
      const loginRoute = routeConfig.find(r => r.path === 'login') || {};
      loginRoute.component = SuseLoginComponent;
      router.resetConfig(routeConfig);
      CustomModule.init = true;
    }
  }
}
