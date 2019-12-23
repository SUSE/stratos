import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PanelPreviewService } from '../../../../../../../core/src/shared/services/panel-preview.service';
import { KubernetesBaseTestModules, KubernetesGuidMock } from '../../../kubernetes.testing.module';
import { KubernetesEndpointService } from '../../../services/kubernetes-endpoint.service';
import { KubernetesNodeLinkComponent } from './kubernetes-node-link.component';

describe('KubernetesNodeLinkComponent', () => {
  let component: KubernetesNodeLinkComponent;
  let fixture: ComponentFixture<KubernetesNodeLinkComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [KubernetesNodeLinkComponent],
      imports: KubernetesBaseTestModules,
      providers: [KubernetesEndpointService, KubernetesGuidMock, PanelPreviewService]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesNodeLinkComponent);
    component = fixture.componentInstance;
    component.row = {
      metadata: {
        namespace: 'test',
        name: 'test',
        uid: 'test'
      },
      status: {
        conditions: [],
        addresses: [],
        images: []
      },
      spec: {
        containers: [],
        nodeName: 'test',
        schedulerName: 'test',
        initContainers: []
      }
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
