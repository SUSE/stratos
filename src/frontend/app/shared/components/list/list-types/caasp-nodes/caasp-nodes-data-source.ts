import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';

import { ApplicationService } from '../../../../../features/applications/application.service';
import { GetAppEnvVarsAction } from '../../../../../store/actions/app-metadata.actions';
import { AppVariablesAdd, AppVariablesEdit } from '../../../../../store/actions/app-variables.actions';
import { getPaginationKey } from '../../../../../store/actions/pagination.actions';
import { AppState } from '../../../../../store/app-state';
import { APIResource } from '../../../../../store/types/api.types';
import { AppEnvVarSchema, AppEnvVarsState } from '../../../../../store/types/app-metadata.types';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';
import { GetCaaspInfo, CaaspInfoSchema } from '../../../../../store/actions/caasp.actions';

export interface CaaspNodeInfo {
  fqdn: string;
  minion_id: string;
  role: string;
}

export class CaaspNodesDataSource extends ListDataSource<CaaspNodeInfo, any> {

  public casspGuid: string;

  constructor(
    store: Store<AppState>,
    caaspId: string,
    listConfig: IListConfig<CaaspNodeInfo>
  ) {
    super({
      store,
      action: new GetCaaspInfo(caaspId),
      schema: CaaspInfoSchema,
      getRowUniqueId: object => object.name,
      paginationKey: getPaginationKey(CaaspInfoSchema.key, caaspId),
      transformEntity: map(caaspInfo => {
        if (!caaspInfo || caaspInfo.length === 0) {
          return [];
        }
        const rows = [...caaspInfo[0].assigned_minions];
        return rows;
      }),
      isLocal: true,
      //transformEntities: [{ type: 'filter', field: 'name' }],
      listConfig
    });
  }

}
