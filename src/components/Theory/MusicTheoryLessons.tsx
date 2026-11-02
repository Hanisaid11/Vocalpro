import React from 'react';
import { MusicTheoryAcademy } from './MusicTheoryAcademy';
import { AppLanguage, NotationSystem } from '../../types/vocal';

export interface MusicTheoryLessonsProps {
  language?: AppLanguage;
  notation?: NotationSystem;
  onOpenPiano?: () => void;
  onClose?: () => void;
}

/**
 * Music Theory Lessons Component
 * Provides structured educational content on reading musical notation,
 * starting from basics (the 5-line staff, clefs, Middle C) to advanced levels
 * (accidentals, microtones, dynamics, tempi, and articulations).
 * Features text-based explanations, interactive diagrams, audio examples,
 * and a simple interactive quiz at the end of every lesson.
 */
export const MusicTheoryLessons: React.FC<MusicTheoryLessonsProps> = ({
  language = 'ar',
  notation = 'arabic',
  onOpenPiano,
  onClose,
}) => {
  return (
    <MusicTheoryAcademy
      language={language}
      notation={notation}
      onOpenPiano={onOpenPiano}
      onClose={onClose}
    />
  );
};

export default MusicTheoryLessons;
