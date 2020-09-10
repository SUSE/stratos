import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ListConfig } from '../../../../../../core/src/shared/components/list/list.component.types';
import { KubernetesResourceListConfigService } from './kubernetes-resource-list';

@Component({
  selector: 'app-kubernetes-resource-list',
  // templateUrl: './kubernetes-resource-list.component.html',
  template: '<app-list></app-list>',
  styleUrls: ['./kubernetes-resource-list.component.scss'],
  providers: [{
    provide: ListConfig,
    useClass: KubernetesResourceListConfigService,
  }]
})
export class KubernetesResourceListComponent {

  public entityCatalogKey: string;

  // public listConfig: any;

  constructor(route: ActivatedRoute, router: Router) {
    // Entity Catalog Key can be specified in the route config
    this.entityCatalogKey = route.snapshot.data.entityCatalogKey;
    if (!this.entityCatalogKey) {
      // Default is to use the last part of the route
      const routeParts = router.url.split('/');
      this.entityCatalogKey = routeParts[routeParts.length - 1];
      }

//      const catalog = kubeEntityCatalog[this.entityCatalogKey];

    // Set list config

    // store: Store<AppState>,
    // kubeId: BaseKubeGuid,
  }
}
