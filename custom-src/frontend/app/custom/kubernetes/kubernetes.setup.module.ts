import { CommonModule } from '@angular/common';
import { NgModule, Optional, SkipSelf } from '@angular/core';
import { Store } from '@ngrx/store';

import { AppState } from '../../../../store/src/app-state';
import { EntityCatalogModule } from '../../../../store/src/entity-catalog.module';
import { EndpointHealthCheck } from '../../../endpoints-health-checks';
import { CoreModule } from '../../core/core.module';
import { EndpointsService } from '../../core/endpoints.service';
import { SharedModule } from '../../shared/shared.module';
import { KubernetesAWSAuthFormComponent } from './auth-forms/kubernetes-aws-auth-form/kubernetes-aws-auth-form.component';
import {
  KubernetesCertsAuthFormComponent,
} from './auth-forms/kubernetes-certs-auth-form/kubernetes-certs-auth-form.component';
import {
  KubernetesConfigAuthFormComponent,
} from './auth-forms/kubernetes-config-auth-form/kubernetes-config-auth-form.component';
import { KubernetesGKEAuthFormComponent } from './auth-forms/kubernetes-gke-auth-form/kubernetes-gke-auth-form.component';
import { KubernetesEndpointPreviewComponent } from './kubernetes-endpoint-preview/kubernetes-endpoint-preview.component';
import { KUBERNETES_ENDPOINT_TYPE } from './kubernetes-entity-factory';
import { generateKubernetesEntities } from './kubernetes-entity-generator';
import { KubernetesNodePreviewComponent } from './kubernetes-node/kubernetes-node-preview/kubernetes-node-preview.component';
import { BaseKubeGuid } from './kubernetes-page.types';
import { KubernetesPodPreviewComponent } from './kubernetes-pod-preview/kubernetes-pod-preview.component';
import { KubernetesStoreModule } from './kubernetes.store.module';
import { KubernetesEndpointService } from './services/kubernetes-endpoint.service';
import { KubernetesNodeService } from './services/kubernetes-node.service';
import { KubeHealthCheck } from './store/kubernetes.actions';


@NgModule({
  imports: [
    EntityCatalogModule.forFeature(generateKubernetesEntities),
    CoreModule,
    CommonModule,
    SharedModule,
    KubernetesStoreModule
  ],
  declarations: [
    KubernetesCertsAuthFormComponent,
    KubernetesAWSAuthFormComponent,
    KubernetesConfigAuthFormComponent,
    KubernetesGKEAuthFormComponent,
    KubernetesEndpointPreviewComponent,
    KubernetesNodePreviewComponent,
    KubernetesPodPreviewComponent,
  ],
  providers: [
    BaseKubeGuid,
    KubernetesEndpointService,
    KubernetesNodeService,
  ],
  entryComponents: [
    KubernetesCertsAuthFormComponent,
    KubernetesAWSAuthFormComponent,
    KubernetesConfigAuthFormComponent,
    KubernetesGKEAuthFormComponent,
    KubernetesEndpointPreviewComponent,
    KubernetesNodePreviewComponent,
    KubernetesPodPreviewComponent,
  ]
})
export class KubernetesSetupModule {
  constructor(
    endpointService: EndpointsService,
    store: Store<AppState>,
    @Optional() @SkipSelf() parentModule: KubernetesSetupModule
  ) {
    if (parentModule) {
      // Module has already been imported
    } else {
      endpointService.registerHealthCheck(
        new EndpointHealthCheck(KUBERNETES_ENDPOINT_TYPE, (endpoint) => store.dispatch(new KubeHealthCheck(endpoint.guid)))
      );
    }
  }
}
