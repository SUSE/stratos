import { IUpdateOrganization } from '../../../core/src/core/cf-api.types';
import {
  DeleteOrganization,
  GetAllOrganizations,
  GetOrganization,
  UpdateOrganization,
} from '../actions/organization.actions';
import { CFBasePipelineRequestActionMeta } from '../cf-entity-generator';
import { CFOrchestratedActionBuilders } from './cf.action-builder.types';

export interface OrganizationActionBuilders extends CFOrchestratedActionBuilders {
  get: (
    guid: string,
    endpointGuid: string,
    { includeRelations, populateMissing }?: CFBasePipelineRequestActionMeta
  ) => GetOrganization;
  getMultiple: (
    endpointGuid: string,
    paginationKey: string,
    { includeRelations, populateMissing }?: CFBasePipelineRequestActionMeta
  ) => GetAllOrganizations;
  remove: (guid: string, endpointGuid: string) => DeleteOrganization;
  update: (guid: string, endpointGuid: string, updatedOrg: IUpdateOrganization) => UpdateOrganization;
}

export const organizationActionBuilders: OrganizationActionBuilders = {
  get: (
    guid,
    endpointGuid,
    { includeRelations, populateMissing }: CFBasePipelineRequestActionMeta = {}
  ) => new GetOrganization(guid, endpointGuid, includeRelations, populateMissing),
  getMultiple: (
    endpointGuid,
    paginationKey,
    { includeRelations, populateMissing }: CFBasePipelineRequestActionMeta = {}
  ) => new GetAllOrganizations(paginationKey, endpointGuid, includeRelations, populateMissing),
  remove: (guid, endpointGuid) => new DeleteOrganization(guid, endpointGuid),
  update: (guid, endpointGuid, updatedOrg: IUpdateOrganization) => new UpdateOrganization(
    guid,
    endpointGuid,
    updatedOrg
  )
};
