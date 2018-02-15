import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { map, switchMap, tap } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

import { EntityServiceFactory } from '../../../../../../core/entity-service-factory.service';
import { getOrgRolesString } from '../../../../../../features/cloud-foundry/cf.helpers';
import { CloudFoundryEndpointService } from '../../../../../../features/cloud-foundry/cloud-foundry-base/cloud-foundry-endpoint.service';
import { RouterNav } from '../../../../../../store/actions/router.actions';
import { AppState } from '../../../../../../store/app-state';
import { APIResource } from '../../../../../../store/types/api.types';
import { EndpointUser } from '../../../../../../store/types/endpoint.types';
import { CfOrgSpaceDataService } from '../../../../../data-services/cf-org-space-service.service';
import { CfUserService } from '../../../../../data-services/cf-user.service';
import { TableCellCustom } from '../../../list-table/table-cell/table-cell-custom';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import {
  CfQuotaDefinition,
  CfOrg
} from '../../../../../../store/types/org-and-space.types';
import { CfApplication } from '../../../../../../store/types/application.types';

@Component({
  selector: 'app-cf-org-card',
  templateUrl: './cf-org-card.component.html',
  styleUrls: ['./cf-org-card.component.scss']
})
export class CfOrgCardComponent extends TableCellCustom<APIResource>
  implements OnInit, OnDestroy {
  normalisedMemoryUsage: number;
  memoryLimit: number;
  instancesLimit: number;
  subscriptions: Subscription[] = [];
  memoryTotal: number;
  instancesCount: number;
  orgApps$: Observable<APIResource<any>[]>;
  appCount: number;
  userRolesInOrg: string;
  currentUser$: Observable<EndpointUser>;
  hasLoaded$ = new BehaviorSubject<boolean>(false);
  @Input('row') row: APIResource<CfOrg>;

  constructor(
    private cfUserService: CfUserService,
    private cfEndpointService: CloudFoundryEndpointService,
    private entityServiceFactory: EntityServiceFactory,
    private store: Store<AppState>,
    private cfOrgSpaceDataService: CfOrgSpaceDataService
  ) {
    super();
  }

  ngOnInit() {
    const userRole$ = this.cfEndpointService.currentUser$.pipe(
      switchMap(u => {
        return this.cfUserService.getUserRoleInOrg(
          u.guid,
          this.row.entity.guid,
          this.row.entity.cfGuid
        );
      }),
      map(u => getOrgRolesString(u))
    );

    const fetchData$ = Observable.combineLatest(
      userRole$,
      this.cfEndpointService.getAppsInOrg(this.row)
    ).pipe(
      tap(([role, apps]) => {
        this.setValues(role, apps);
        this.hasLoaded$.next(true);
      })
    );

    this.subscriptions.push(fetchData$.subscribe());
  }

  setCounts = (apps: APIResource<any>[]) => {
    this.appCount = apps.length;
    let count = 0;
    apps.forEach(a => {
      count += a.entity.instances;
    });
    this.instancesCount = count;
  }

  setValues = (role: string, apps: APIResource<CfApplication>[]) => {
    this.userRolesInOrg = role;
    this.setCounts(apps);
    this.memoryTotal = this.cfEndpointService.getMetricFromApps(apps, 'memory');
    const quotaDefinition = this.row.entity.quota_definition;
    this.instancesLimit = quotaDefinition.entity.app_instance_limit;
    this.memoryLimit = quotaDefinition.entity.memory_limit;
    this.normalisedMemoryUsage = this.memoryTotal / this.memoryLimit * 100;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(p => p.unsubscribe());
  }

  edit = () => {
    this.store.dispatch(
      new RouterNav({
        path: ['cloud-foundry', this.cfEndpointService.cfGuid, 'edit-org']
      })
    );
  }

  delete = () => {
    this.cfOrgSpaceDataService.deleteOrg(
      this.row.entity.guid,
      this.cfEndpointService.cfGuid
    );
  }
}
