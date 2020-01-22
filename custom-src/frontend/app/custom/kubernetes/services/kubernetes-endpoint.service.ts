import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, first, map, shareReplay, startWith, switchMap } from 'rxjs/operators';

import { GetAllEndpoints } from '../../../../../store/src/actions/endpoint.actions';
import { AppState } from '../../../../../store/src/app-state';
import { endpointSchemaKey, entityFactory } from '../../../../../store/src/helpers/entity-factory';
import { getPaginationObservables } from '../../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';
import { EntityInfo } from '../../../../../store/src/types/api.types';
import { EndpointModel, EndpointUser } from '../../../../../store/src/types/endpoint.types';
import { EntityService } from '../../../core/entity-service';
import { EntityServiceFactory } from '../../../core/entity-service-factory.service';
import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';
import { BaseKubeGuid } from '../kubernetes-page.types';
import { KubernetesDeployment, KubernetesPod, KubernetesStatefulSet, KubeService } from '../store/kube.types';
import {
  GeKubernetesDeployments,
  GetKubernetesDashboard,
  GetKubernetesPods,
  GetKubernetesServices,
  GetKubernetesStatefulSets,
  KubePaginationAction,
} from '../store/kubernetes.actions';
import { KubeDashboardStatus } from '../store/kubernetes.effects';
import {
  kubernetesDashboardSchemaKey,
  kubernetesDeploymentsSchemaKey,
  kubernetesPodsSchemaKey,
  kubernetesServicesSchemaKey,
  kubernetesStatefulSetsSchemaKey,
} from '../store/kubernetes.entities';
import { AuthState } from '../../../../../store/src/reducers/auth.reducer';

@Injectable()
export class KubernetesEndpointService {
  info$: Observable<EntityInfo<any>>;
  cfInfoEntityService: EntityService<any>;
  endpoint$: Observable<EntityInfo<EndpointModel>>;
  kubeEndpointEntityService: EntityService<EndpointModel>;
  connected$: Observable<boolean>;
  currentUser$: Observable<EndpointUser>;
  kubeGuid: string;
  deployments$: Observable<KubernetesDeployment[]>;
  statefulSets$: Observable<KubernetesStatefulSet[]>;
  services$: Observable<KubeService[]>;
  pods$: Observable<KubernetesPod[]>;
  kubeDashboardEnabled$: Observable<boolean>;
  kubeDashboardVersion$: Observable<string>;
  kubeDashboardStatus$: Observable<KubeDashboardStatus>;
  kubeDashboardLabel$: Observable<string>;
  kubeDashboardConfigured$: Observable<boolean>;

  constructor(
    public baseKube: BaseKubeGuid,
    private store: Store<AppState>,
    private entityServiceFactory: EntityServiceFactory,
    private paginationMonitorFactory: PaginationMonitorFactory
  ) {
    this.kubeGuid = baseKube.guid;
    this.kubeEndpointEntityService = this.entityServiceFactory.create(
      endpointSchemaKey,
      entityFactory(endpointSchemaKey),
      this.kubeGuid,
      new GetAllEndpoints(),
      false
    );

    this.constructCoreObservables();
  }

  constructCoreObservables() {
    this.endpoint$ = this.kubeEndpointEntityService.waitForEntity$;

    this.connected$ = this.endpoint$.pipe(
      map(p => p.entity.connectionStatus === 'connected')
    );

    this.currentUser$ = this.endpoint$.pipe(map(e => e.entity.user), shareReplay(1));

    this.deployments$ = this.getObservable<KubernetesDeployment>(
      new GeKubernetesDeployments(this.kubeGuid),
      kubernetesDeploymentsSchemaKey
    );

    this.pods$ = this.getObservable<KubernetesPod>(
      new GetKubernetesPods(this.kubeGuid),
      kubernetesPodsSchemaKey
    );

    this.statefulSets$ = this.getObservable<KubernetesStatefulSet>(
      new GetKubernetesStatefulSets(this.kubeGuid),
      kubernetesStatefulSetsSchemaKey
    );

    this.services$ = this.getObservable<KubeService>(
      new GetKubernetesServices(this.kubeGuid),
      kubernetesServicesSchemaKey
    );

    this.kubeDashboardEnabled$ = this.store.select('auth').pipe(
      filter(auth => !!auth.sessionData['plugin-config']),
      map(auth => auth.sessionData['plugin-config'].kubeDashboardEnabled === 'true')
    );

    this.kubeDashboardStatus$ = this.kubeDashboardEnabled$.pipe(
      filter(enabled => enabled),
      switchMap(() => this.entityServiceFactory.create<KubeDashboardStatus>(
      kubernetesDashboardSchemaKey,
      entityFactory(kubernetesDashboardSchemaKey),
      this.kubeGuid,
      new GetKubernetesDashboard(this.kubeGuid),
      false
    ).waitForEntity$.pipe(map(status => status.entity)).pipe(
      startWith(null),
    )
    ));

    this.kubeDashboardConfigured$ = this.kubeDashboardStatus$.pipe(
      filter(status => !!status),
      map(status => {
        return status.installed && !!status.serviceAccount && !!status.service;
      }),
      startWith(false)
    );

    this.kubeDashboardLabel$ = this.kubeDashboardStatus$.pipe(
      filter(status => !!status),
      map(status => {
        if (!status.installed) {
          return 'Not installed';
        } else if (!status.serviceAccount) {
          return 'Not configured';
        } else {
          return status.version;
        }
      })
    );
  }

  public refreshKubernetesDashboardStatus() {
    this.store.dispatch(new GetKubernetesDashboard(this.kubeGuid));
  }

  private getObservable<T>(paginationAction: KubePaginationAction, schemaKey: string): Observable<T[]> {
    return getPaginationObservables<T>({
      store: this.store,
      action: paginationAction,
      paginationMonitor: this.paginationMonitorFactory.create(paginationAction.paginationKey, entityFactory(schemaKey))
    }, true).entities$.pipe(filter(p => !!p), first());
  }
}
