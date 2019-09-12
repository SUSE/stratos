import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { BehaviorSubject, combineLatest as observableCombineLatest, Observable, of as observableOf } from 'rxjs';
import { combineLatest, filter, first, map, publishReplay, refCount, switchMap } from 'rxjs/operators';

import {
  cfEntityFactory,
  serviceBrokerEntityType,
  servicePlanVisibilityEntityType,
  spaceEntityType,
} from '../../../../cloud-foundry/src/cf-entity-factory';
import {
  IService,
  IServiceBroker,
  IServiceExtra,
  IServiceInstance,
  IServicePlan,
  IServicePlanVisibility,
} from '../../../../core/src/core/cf-api-svc.types';
import { ISpace } from '../../../../core/src/core/cf-api.types';
import { EntityService } from '../../../../core/src/core/entity-service';
import { PaginationMonitorFactory } from '../../../../core/src/shared/monitors/pagination-monitor.factory';
import { getPaginationObservables } from '../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';
import { APIResource } from '../../../../store/src/types/api.types';
import { getIdFromRoute } from '../cloud-foundry/cf.helpers';
import { getCfService, getServiceInstancesInCf, getServicePlans } from './services-helper';
import { CFAppState } from '../../../../cloud-foundry/src/cf-app-state';
import { GetServicePlanVisibilities } from '../../actions/service-plan-visibility.actions';
import { GetServiceBrokers } from '../../actions/service-broker.actions';
import { GetSpace } from '../../actions/space.actions';
import { createEntityRelationPaginationKey } from '../../entity-relations/entity-relations.types';
import { CFEntityServiceFactory } from '../../cf-entity-service-factory.service';
import { entityCatalogue } from '../../../../core/src/core/entity-catalogue/entity-catalogue.service';
import { CF_ENDPOINT_TYPE } from '../../../cf-types';
import { EntityServiceFactory } from '../../../../core/src/core/entity-service-factory.service';

export interface ServicePlanAccessibility {
  spaceScoped?: boolean;
  hasVisibilities?: boolean;
  isPublic: boolean;
  guid?: string;
  spaceGuid?: string;
}

export interface SpaceScopedService {
  isSpaceScoped: boolean;
  spaceGuid?: string;
  orgGuid?: string;
}

@Injectable()
export class ServicesService {
  isSpaceScoped$: Observable<SpaceScopedService>;
  allServiceInstances$: Observable<APIResource<IServiceInstance>[]>;
  serviceInstances$: Observable<APIResource<IServiceInstance>[]>;
  serviceGuid: any;
  cfGuid: any;
  serviceBrokers$: Observable<APIResource<IServiceBroker>[]>;
  serviceBroker$: Observable<APIResource<IServiceBroker>>;
  servicePlanVisibilities$: Observable<APIResource<IServicePlanVisibility>[]>;
  servicePlans$: Observable<APIResource<IServicePlan>[]>;
  serviceExtraInfo$: Observable<IServiceExtra>;
  service$: Observable<APIResource<IService>>;
  serviceEntityService: EntityService<APIResource<IService>>;
  initialised$ = new BehaviorSubject(false);

  constructor(
    private store: Store<CFAppState>,
    private entityServiceFactory: CFEntityServiceFactory,
    public activatedRoute: ActivatedRoute,
    private paginationMonitorFactory: PaginationMonitorFactory

  ) {

    this.cfGuid = getIdFromRoute(activatedRoute, 'endpointId');
    this.serviceGuid = getIdFromRoute(activatedRoute, 'serviceId');

    this.serviceEntityService = getCfService(this.serviceGuid, this.cfGuid, this.entityServiceFactory);
    this.service$ = this.serviceEntityService.waitForEntity$.pipe(
      filter(o => !!o && !!o.entity),
      map(o => o.entity),
      publishReplay(1),
      refCount()
    );

    this.initBaseObservables();
  }

  getServicePlanVisibilities = () => {
    const paginationKey = createEntityRelationPaginationKey(servicePlanVisibilityEntityType, this.cfGuid);
    const servicePlanVisibilityEntity = entityCatalogue.getEntity(CF_ENDPOINT_TYPE, servicePlanVisibilityEntityType);
    const actionBuilder = servicePlanVisibilityEntity.actionOrchestrator.getActionBuilder('getMultiple');
    const getServicePlanVisibilitiesAction = actionBuilder(this.cfGuid, paginationKey);
    return getPaginationObservables<APIResource<IServicePlanVisibility>>(
      {
        store: this.store,
        action: getServicePlanVisibilitiesAction,
        paginationMonitor: this.paginationMonitorFactory.create(
          paginationKey,
          cfEntityFactory(servicePlanVisibilityEntityType)
        )
      },
      true
    ).entities$;
  }
  private getServiceInstances = () => {
    return getServiceInstancesInCf(this.cfGuid, this.store, this.paginationMonitorFactory);
  }

  private getServiceBrokers = () => {
    const paginationKey = createEntityRelationPaginationKey(serviceBrokerEntityType, this.cfGuid);
    const serviceBrokerEntity = entityCatalogue.getEntity(CF_ENDPOINT_TYPE, serviceBrokerEntityType);
    const actionBuilder = serviceBrokerEntity.actionOrchestrator.getActionBuilder('getMultiple');
    const getServiceBrokersAction = actionBuilder(this.cfGuid, paginationKey);
    return getPaginationObservables<APIResource<IServiceBroker>>(
      {
        store: this.store,
        action: getServiceBrokersAction,
        paginationMonitor: this.paginationMonitorFactory.create(
          paginationKey,
          cfEntityFactory(serviceBrokerEntityType)
        )
      },
      true
    ).entities$;
  }

  getServiceBrokerById = (guid: string): Observable<APIResource<IServiceBroker>> => this.serviceBrokers$
    .pipe(
      filter(p => !!p),
      map(brokers => brokers.filter(b => b.metadata.guid === guid)),
      filter(s => s && s.length === 1),
      map(s => s[0]),
      first()
    )

  getServiceName = () => {
    return observableCombineLatest(this.serviceExtraInfo$, this.service$)
      .pipe(
        map(([extraInfo, service]) => {
          if (extraInfo && extraInfo.displayName) {
            return extraInfo.displayName;
          } else {
            return service.entity.label;
          }
        }));
  }

  getServiceProviderName = () => {
    return observableCombineLatest(this.serviceExtraInfo$, this.service$)
      .pipe(
        map(([extraInfo, service]) => {
          if (extraInfo && extraInfo.providerDisplayName) {
            return extraInfo.providerDisplayName;
          } else {
            return '';
          }
        }));
  }

  getServiceDescription = () => {
    return observableCombineLatest(this.serviceExtraInfo$, this.service$)
      .pipe(
        map(([extraInfo, service]) => {
          if (extraInfo && extraInfo.longDescription) {
            return extraInfo.longDescription;
          } else {
            return service.entity.description;
          }
        }));
  }


  getDocumentationUrl = () => this.serviceExtraInfo$.pipe(
    map(p => p ? p.documentationUrl : null)
  )

  getSupportUrl = () => this.serviceExtraInfo$.pipe(
    map(p => p ? p.supportUrl : null)
  )

  hasSupportUrl = () => this.getSupportUrl().pipe(
    map(p => !!p)
  )

  hasDocumentationUrl = () => this.getDocumentationUrl().pipe(
    map(p => !!p)
  )

  getServiceTags = () => this.service$.pipe(
    first(),
    map(service =>
      service.entity.tags.map(t => ({
        value: t,
        hideClearButton$: observableOf(true)
      }))
    )
  )

  private initBaseObservables() {
    this.servicePlanVisibilities$ = this.getServicePlanVisibilities();
    this.serviceExtraInfo$ = this.service$.pipe(map(o => JSON.parse(o.entity.extra)));
    this.servicePlans$ = getServicePlans(this.service$, this.cfGuid, this.store, this.paginationMonitorFactory);
    this.serviceBrokers$ = this.getServiceBrokers();
    this.serviceBroker$ = this.serviceBrokers$.pipe(
      filter(p => !!p && p.length > 0),
      combineLatest(this.service$),
      map(([brokers, service]) => brokers.filter(broker => broker.metadata.guid === service.entity.service_broker_guid)),
      map(o => (o.length === 0 ? null : o[0]))
    );
    this.isSpaceScoped$ = this.serviceBroker$.pipe(
      map(o => o ? o.entity.space_guid : null),
      switchMap(spaceGuid => {
        if (!spaceGuid) {
          // Its possible the user is unable to see service broker,
          // therefore, we can't know if this service is space-scoped or not.
          // We are assuming it's not, since we dont have any other means of determining that.
          return observableOf({
            isSpaceScoped: false
          });
        } else {
          const spaceEntity = entityCatalogue.getEntity(CF_ENDPOINT_TYPE, spaceEntityType);
          const actionBuilder = spaceEntity.actionOrchestrator.getActionBuilder('get');
          const getSpaceAction = actionBuilder(spaceGuid, this.cfGuid);
          const spaceEntityService = this.entityServiceFactory.create<APIResource<ISpace>>(
            spaceGuid,
            getSpaceAction,
            true
          );
          return spaceEntityService.waitForEntity$.pipe(
            filter(o => !!o && !!o.entity),
            map(o => ({
              isSpaceScoped: true,
              spaceGuid,
              orgGuid: o.entity.entity.organization_guid
            })),
          );
        }
      })
    );
    this.allServiceInstances$ = this.getServiceInstances();
    this.serviceInstances$ = this.allServiceInstances$.pipe(
      map(instances => instances.filter(instance => instance.entity.service_guid === this.serviceGuid))
    );
  }
}
