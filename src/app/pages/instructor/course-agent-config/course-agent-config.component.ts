import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../../components/navbar/navbar.component';

interface AgentConfig {
  communicationStyle: 'formal' | 'casual' | 'mentor' | 'humorous';
  responseDepth: 'brief' | 'intermediate' | 'deep';
  externalSources: {
    enabled: boolean;
    sources: {
      wikipedia: boolean;
      youtube: boolean;
      academic: boolean;
      custom: string[];
    };
  };
  restrictions: {
    topics: string[];
    policies: string[];
  };
  outOfScopeResponse: 'ask_instructor' | 'not_covered' | 'custom';
  customOutOfScopeMessage?: string;
}

@Component({
  selector: 'app-course-agent-config',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent],
  templateUrl: './course-agent-config.component.html',
  styleUrls: ['./course-agent-config.component.scss']
})
export class CourseAgentConfigComponent implements OnInit {
  config: AgentConfig = {
    communicationStyle: 'formal',
    responseDepth: 'intermediate',
    externalSources: {
      enabled: false,
      sources: {
        wikipedia: false,
        youtube: false,
        academic: false,
        custom: []
      }
    },
    restrictions: {
      topics: [],
      policies: []
    },
    outOfScopeResponse: 'ask_instructor'
  };

  communicationStyles = [
    { value: 'formal', label: 'Formal académico', description: 'Comunicación profesional y estructurada, ideal para contenido técnico.' },
    { value: 'casual', label: 'Amigable y casual', description: 'Tono conversacional y cercano, manteniendo el profesionalismo.' },
    { value: 'mentor', label: 'Mentor motivador', description: 'Enfoque en guiar y motivar al estudiante, con feedback constructivo.' },
    { value: 'humorous', label: 'Respuestas con humor (ligero)', description: 'Incorporación de humor sutil para hacer el aprendizaje más ameno.' }
  ];

  responseDepths = [
    { value: 'brief', label: 'Breve y directo', description: 'Respuestas concisas y al punto.' },
    { value: 'intermediate', label: 'Intermedio con ejemplos', description: 'Explicaciones detalladas con ejemplos prácticos.' },
    { value: 'deep', label: 'Profundo con referencias', description: 'Análisis exhaustivo con referencias y contexto adicional.' }
  ];

  outOfScopeResponses = [
    { value: 'ask_instructor', label: 'No estoy seguro, pero puedes preguntar al instructor.' },
    { value: 'not_covered', label: 'Ese tema no está cubierto en este curso.' },
    { value: 'custom', label: 'Mensaje personalizado' }
  ];

  newRestrictionTopic: string = '';
  newRestrictionPolicy: string = '';
  newCustomSource: string = '';

  constructor() {}

  ngOnInit() {
    // TODO: Load instructor's global agent config
    this.loadAgentConfig();
  }

  private loadAgentConfig() {
    // TODO: Implement API call to load instructor's global agent config
    console.log('Loading instructor global agent configuration...');
  }

  addRestrictionTopic() {
    if (this.newRestrictionTopic.trim()) {
      this.config.restrictions.topics.push(this.newRestrictionTopic.trim());
      this.newRestrictionTopic = '';
    }
  }

  removeRestrictionTopic(index: number) {
    this.config.restrictions.topics.splice(index, 1);
  }

  addRestrictionPolicy() {
    if (this.newRestrictionPolicy.trim()) {
      this.config.restrictions.policies.push(this.newRestrictionPolicy.trim());
      this.newRestrictionPolicy = '';
    }
  }

  removeRestrictionPolicy(index: number) {
    this.config.restrictions.policies.splice(index, 1);
  }

  addCustomSource() {
    if (this.newCustomSource.trim()) {
      this.config.externalSources.sources.custom.push(this.newCustomSource.trim());
      this.newCustomSource = '';
    }
  }

  removeCustomSource(index: number) {
    this.config.externalSources.sources.custom.splice(index, 1);
  }

  saveConfig() {
    // TODO: Implement API call to save instructor's global agent config
    console.log('Saving instructor global agent config:', this.config);
    alert('Configuración global del agente guardada exitosamente!');
  }
} 