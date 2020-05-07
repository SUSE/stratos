import { CfAPIResource } from '../../../cloud-foundry/src/store/types/cf-api.types';
import { IEntityMetadata } from '../../../store/src/entity-catalog/entity-catalog.types';
import { EndpointModel } from '../../../store/src/types/endpoint.types';
import { IFavoriteMetadata, UserFavorite } from '../../../store/src/types/user-favorites.types';
import { FavoritesConfigMapper } from '../shared/components/favorites-meta-card/favorite-config-mapper';
import { entityCatalog } from './../../../store/src/entity-catalog/entity-catalog.service';

export function isEndpointTypeFavorite(favorite: UserFavorite<IFavoriteMetadata>) {
  return !favorite.entityId;
}

// Uses the endpoint definition to get the helper that can look up an entitty
export function getFavoriteFromEntity<T extends IEntityMetadata = IEntityMetadata>(
  entity,
  entityKey: string,
  favoritesConfigMapper: FavoritesConfigMapper,
  entityType: string
): UserFavorite<T> {
  // Use entity catalog to get favorite for the given endpoint type
  const endpoint = entityCatalog.getEndpoint(entityType);
  if (endpoint && endpoint.definition && endpoint.definition.favoriteFromEntity) {
    return endpoint.definition.favoriteFromEntity(entity, entityKey, favoritesConfigMapper);
  }

  return null;
}

export function deriveEndpointFavoriteFromFavorite(favorite: UserFavorite<IFavoriteMetadata>) {
  if (favorite.entityType !== 'endpoint') {
    const endpointFav = {
      ...favorite
    };
    endpointFav.entityId = null;
    endpointFav.entityType = 'endpoint';
    endpointFav.guid = UserFavorite.buildFavoriteStoreEntityGuid(endpointFav);
    return endpointFav;
  }
  return favorite;
}

function isEndpointEntity(endpoint: EndpointModel) {
  return endpoint && endpoint.guid && endpoint.cnsi_type;
}

function isCfEntity(entity: CfAPIResource) {
  return entity && entity.entity.cfGuid && entity.metadata && entity.metadata.guid;
}

