import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {
  KubernetesActivatedRouteMock,
  KubernetesBaseTestModules,
  KubernetesGuidMock,
} from '../../../../kubernetes.testing.module';
import { KubernetesEndpointService } from '../../../../services/kubernetes-endpoint.service';
import { KubernetesNodeService } from '../../../../services/kubernetes-node.service';
import { KubernetesNodeTagsCardComponent } from './kubernetes-node-tags-card.component';

describe('KubernetesNodeTagsCardComponent', () => {
  let component: KubernetesNodeTagsCardComponent;
  let fixture: ComponentFixture<KubernetesNodeTagsCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [KubernetesNodeTagsCardComponent],
      imports: KubernetesBaseTestModules,
      providers: [
        KubernetesGuidMock,
        KubernetesActivatedRouteMock,
        KubernetesEndpointService,
        KubernetesNodeService
      ],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesNodeTagsCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
