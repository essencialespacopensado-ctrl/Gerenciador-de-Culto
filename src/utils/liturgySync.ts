import { WorshipProgram, ActivityItem, WorshipPraiseItem, MediaLink } from '../types';
import { getSabbathSchoolManualForDate } from '../data/sabbathSchoolManualData';

export const PRAISE_STORAGE_KEY = 'iasd_escola_sabatina_culto_items_v2';

/**
 * Synchronizes the 3 Praises + 1 Musical Message (and any other praise items)
 * directly into the main Worship Program activities (Liturgia Principal).
 */
export function syncPraiseItemsToProgram(
  praiseItems: WorshipPraiseItem[],
  currentProgram: WorshipProgram
): WorshipProgram {
  const activities = [...currentProgram.activities];

  const esPraises = praiseItems.filter(
    i => i.kind === 'louvor_congregacional' && i.section === 'escola_sabatina'
  );
  const cdPraises = praiseItems.filter(
    i => i.kind === 'louvor_congregacional' && i.section === 'culto_divino'
  );
  const cdMusicalMessages = praiseItems.filter(
    i => i.kind === 'mensagem_musical' && i.section === 'culto_divino'
  );
  const esMusicalMessages = praiseItems.filter(
    i => i.kind === 'mensagem_musical' && i.section === 'escola_sabatina'
  );

  // 0. Synchronize explicitly targeted activities (targetActivityId)
  praiseItems.forEach(item => {
    if (item.targetActivityId) {
      const actIdx = activities.findIndex(a => a.id === item.targetActivityId);
      if (actIdx >= 0) {
        const media: MediaLink = {
          title: item.title,
          url: item.youtubeUrlOrQuery,
          note: [item.artistOrGroup, item.key ? `Tom: ${item.key}` : null].filter(Boolean).join(' • '),
        };
        activities[actIdx] = {
          ...activities[actIdx],
          congregational1: media,
          responsible: item.artistOrGroup || activities[actIdx].responsible,
          isRecurring: item.isRecurring !== undefined ? item.isRecurring : activities[actIdx].isRecurring,
        };
      }
    }
  });

  // 1. Synchronize Escola Sabatina Opening & Closing Hymns (if specifically defined or from manual)
  const esInitialHymn = praiseItems.find(
    i => (i.momentDescription?.toLowerCase().includes('hino inicial') || i.title.toLowerCase().includes('hino inicial')) &&
         i.section === 'escola_sabatina'
  );
  if (esInitialHymn) {
    const actIdx = activities.findIndex(
      a => a.section === 'escola_sabatina' && 
           (a.name.toLowerCase().includes('hino inicial') || a.id === 'act-3')
    );
    const media: MediaLink = {
      title: esInitialHymn.title,
      url: esInitialHymn.youtubeUrlOrQuery,
      note: [esInitialHymn.artistOrGroup, esInitialHymn.key ? `Tom: ${esInitialHymn.key}` : null, 'Manual da Escola Sabatina'].filter(Boolean).join(' • '),
    };
    if (actIdx >= 0) {
      activities[actIdx] = {
        ...activities[actIdx],
        name: `Hino Inicial Escola Sabatina: ${esInitialHymn.title}`,
        congregational1: media,
        isRecurring: esInitialHymn.isRecurring ?? true,
      };
    }
  }

  const esFinalHymn = praiseItems.find(
    i => (i.momentDescription?.toLowerCase().includes('hino final') || i.title.toLowerCase().includes('hino final')) &&
         i.section === 'escola_sabatina'
  );
  if (esFinalHymn) {
    const actIdx = activities.findIndex(
      a => a.section === 'escola_sabatina' && a.name.toLowerCase().includes('hino final')
    );
    const media: MediaLink = {
      title: esFinalHymn.title,
      url: esFinalHymn.youtubeUrlOrQuery,
      note: [esFinalHymn.artistOrGroup, esFinalHymn.key ? `Tom: ${esFinalHymn.key}` : null, 'Manual da Escola Sabatina'].filter(Boolean).join(' • '),
    };
    if (actIdx >= 0) {
      activities[actIdx] = {
        ...activities[actIdx],
        name: `Hino Final Escola Sabatina: ${esFinalHymn.title}`,
        congregational1: media,
        isRecurring: esFinalHymn.isRecurring ?? true,
      };
    } else {
      // Find end of Escola Sabatina or after lesson
      const lessonIdx = activities.findIndex(
        a => a.section === 'escola_sabatina' && (a.name.toLowerCase().includes('lição') || a.name.toLowerCase().includes('licao'))
      );
      const newAct: ActivityItem = {
        id: `act-hino-final-es-${Date.now()}`,
        name: `Hino Final Escola Sabatina: ${esFinalHymn.title}`,
        section: 'escola_sabatina',
        category: 'louvor',
        responsible: esFinalHymn.artistOrGroup || 'Congregação',
        durationMinutes: 4,
        congregational1: media,
        isRecurring: esFinalHymn.isRecurring ?? true,
      };
      if (lessonIdx >= 0) {
        activities.splice(lessonIdx + 1, 0, newAct);
      } else {
        const lastEsIdx = activities.map(a => a.section).lastIndexOf('escola_sabatina');
        activities.splice(lastEsIdx + 1, 0, newAct);
      }
    }
  }

  // 1. Synchronize Escola Sabatina Congregational Praises (Hinos 1, 2 e 3)
  if (esPraises.length > 0) {
    const esIdx = activities.findIndex(
      a => a.section === 'escola_sabatina' && (a.category === 'louvor' || a.name.toLowerCase().includes('louvor'))
    );

    const media1: MediaLink = {
      title: esPraises[0].title,
      url: esPraises[0].youtubeUrlOrQuery,
      note: [esPraises[0].artistOrGroup, esPraises[0].key ? `Tom: ${esPraises[0].key}` : null].filter(Boolean).join(' • '),
    };
    const media2: MediaLink | undefined = esPraises[1] ? {
      title: esPraises[1].title,
      url: esPraises[1].youtubeUrlOrQuery,
      note: [esPraises[1].artistOrGroup, esPraises[1].key ? `Tom: ${esPraises[1].key}` : null].filter(Boolean).join(' • '),
    } : undefined;
    const media3: MediaLink | undefined = esPraises[2] ? {
      title: esPraises[2].title,
      url: esPraises[2].youtubeUrlOrQuery,
      note: [esPraises[2].artistOrGroup, esPraises[2].key ? `Tom: ${esPraises[2].key}` : null].filter(Boolean).join(' • '),
    } : undefined;

    const summaryNotes = `Louvores da Escola Sabatina: ${esPraises.map(p => `${p.title}${p.key ? ` (${p.key})` : ''}`).join(' | ')}`;

    if (esIdx >= 0) {
      activities[esIdx] = {
        ...activities[esIdx],
        name: `Momentos de louvor (${esPraises.length} hinos)`,
        responsible: esPraises[0].artistOrGroup || activities[esIdx].responsible,
        congregational1: media1,
        congregational2: media2,
        congregational3: media3,
        notes: summaryNotes,
      };
    } else {
      activities.unshift({
        id: `act-praise-es-${Date.now()}`,
        name: `Momentos de louvor (${esPraises.length} hinos)`,
        section: 'escola_sabatina',
        category: 'louvor',
        responsible: esPraises[0].artistOrGroup || 'Ministério de Louvor',
        durationMinutes: 15,
        congregational1: media1,
        congregational2: media2,
        congregational3: media3,
        notes: summaryNotes,
      });
    }
  }

  // 2. Synchronize Culto Divino Congregational Praises (if configured)
  if (cdPraises.length > 0) {
    const cdIdx = activities.findIndex(
      a => a.section === 'culto_divino' && (a.category === 'louvor' || a.name.toLowerCase().includes('louvor'))
    );
    const media1: MediaLink = {
      title: cdPraises[0].title,
      url: cdPraises[0].youtubeUrlOrQuery,
      note: [cdPraises[0].artistOrGroup, cdPraises[0].key ? `Tom: ${cdPraises[0].key}` : null].filter(Boolean).join(' • '),
    };
    const media2: MediaLink | undefined = cdPraises[1] ? {
      title: cdPraises[1].title,
      url: cdPraises[1].youtubeUrlOrQuery,
      note: [cdPraises[1].artistOrGroup, cdPraises[1].key ? `Tom: ${cdPraises[1].key}` : null].filter(Boolean).join(' • '),
    } : undefined;
    const media3: MediaLink | undefined = cdPraises[2] ? {
      title: cdPraises[2].title,
      url: cdPraises[2].youtubeUrlOrQuery,
      note: [cdPraises[2].artistOrGroup, cdPraises[2].key ? `Tom: ${cdPraises[2].key}` : null].filter(Boolean).join(' • '),
    } : undefined;

    if (cdIdx >= 0) {
      activities[cdIdx] = {
        ...activities[cdIdx],
        congregational1: media1,
        congregational2: media2,
        congregational3: media3,
        responsible: cdPraises[0].artistOrGroup || activities[cdIdx].responsible,
        notes: `Louvores Culto Divino: ${cdPraises.map(p => `${p.title}${p.key ? ` (${p.key})` : ''}`).join(' | ')}`,
      };
    }
  }

  // 3. Synchronize Culto Divino Musical Messages
  if (cdMusicalMessages.length > 0) {
    cdMusicalMessages.forEach((msg, idx) => {
      const msgMedia: MediaLink = {
        title: msg.title,
        url: msg.youtubeUrlOrQuery,
        note: [msg.artistOrGroup, msg.key ? `Tom: ${msg.key}` : null].filter(Boolean).join(' • '),
      };
      const msgNotes = [msg.key ? `Tom: ${msg.key}` : null, msg.momentDescription, msg.notes].filter(Boolean).join(' • ');

      const existingIdx = activities.findIndex(
        a => a.section === 'culto_divino' && (a.category === 'mensagem_musical' || a.name.toLowerCase().includes('mensagem musical'))
      );

      if (existingIdx >= 0 && idx === 0) {
        activities[existingIdx] = {
          ...activities[existingIdx],
          name: `Mensagem Musical: ${msg.title}`,
          responsible: msg.artistOrGroup || activities[existingIdx].responsible,
          notes: msgNotes,
          congregational1: msgMedia,
        };
      } else {
        const sermonIdx = activities.findIndex(
          a => a.section === 'culto_divino' && (a.category === 'sermao' || a.name.toLowerCase().includes('serm'))
        );
        const newAct: ActivityItem = {
          id: `act-msg-cd-${msg.id || idx}`,
          name: `Mensagem Musical: ${msg.title}`,
          section: 'culto_divino',
          category: 'mensagem_musical',
          responsible: msg.artistOrGroup,
          durationMinutes: 5,
          congregational1: msgMedia,
          notes: msgNotes,
        };
        if (sermonIdx >= 0) {
          activities.splice(sermonIdx, 0, newAct);
        } else {
          activities.push(newAct);
        }
      }
    });
  } else {
    // If no musical message in Culto Divino in items list, clear the slot
    const existingIdx = activities.findIndex(
      a => a.section === 'culto_divino' && (a.category === 'mensagem_musical' || a.name.toLowerCase().includes('mensagem musical'))
    );
    if (existingIdx >= 0) {
      activities[existingIdx] = {
        ...activities[existingIdx],
        name: 'Mensagem Musical',
        congregational1: undefined,
        notes: 'Aguardando definição do cantor / grupo musical',
      };
    }
  }

  // 4. Synchronize Escola Sabatina Musical Messages (if any)
  esMusicalMessages.forEach((msg, idx) => {
    const msgMedia: MediaLink = {
      title: msg.title,
      url: msg.youtubeUrlOrQuery,
      note: [msg.artistOrGroup, msg.key ? `Tom: ${msg.key}` : null].filter(Boolean).join(' • '),
    };
    const msgNotes = [msg.key ? `Tom: ${msg.key}` : null, msg.momentDescription, msg.notes].filter(Boolean).join(' • ');

    const existingIdx = activities.findIndex(
      a => a.section === 'escola_sabatina' && (a.category === 'mensagem_musical' || a.name.toLowerCase().includes('mensagem musical'))
    );

    if (existingIdx >= 0 && idx === 0) {
      activities[existingIdx] = {
        ...activities[existingIdx],
        name: `Mensagem Musical: ${msg.title}`,
        responsible: msg.artistOrGroup || activities[existingIdx].responsible,
        notes: msgNotes,
        congregational1: msgMedia,
      };
    }
  });

  return {
    ...currentProgram,
    activities,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Automatically applies the Initial and Final Hymns from the Sabbath School Manual
 * for the given worship date into the program's Escola Sabatina activities.
 */
export function applyManualHymnsToProgram(
  program: WorshipProgram,
  targetDate?: string,
  overrideExisting = false
): WorshipProgram {
  const dateToUse = targetDate || program.date;
  const manual = getSabbathSchoolManualForDate(dateToUse);
  if (!manual || !manual.initialHymn) return program;

  const activities = [...program.activities];

  // 1. Initial Hymn in Escola Sabatina
  const initialIdx = activities.findIndex(
    a => a.section === 'escola_sabatina' && 
         (a.name.toLowerCase().includes('hino inicial') || a.id === 'act-3' || (a.category === 'louvor' && a.name.toLowerCase().includes('abertura')))
  );

  const initialMedia: MediaLink = {
    title: `Hinário ${manual.initialHymn.number} - ${manual.initialHymn.title}`,
    url: manual.initialHymn.youtubeUrl,
    note: `Hino congregacional de abertura • Manual da ES (${manual.quarter})`,
  };

  if (initialIdx >= 0) {
    const current = activities[initialIdx];
    if (overrideExisting || !current.congregational1 || !current.congregational1.title || current.name.includes('Manual')) {
      activities[initialIdx] = {
        ...current,
        name: `Hino Inicial Escola Sabatina: Hinário ${manual.initialHymn.number} - ${manual.initialHymn.title}`,
        responsible: 'Congregação (Manual da Escola Sabatina)',
        congregational1: initialMedia,
        isRecurring: true,
        notes: `Sugerido no Manual da ES: ${manual.lessonTitle}`,
      };
    }
  } else {
    const welcomeIdx = activities.findIndex(
      a => a.section === 'escola_sabatina' && a.name.toLowerCase().includes('vindas')
    );
    const newInitial: ActivityItem = {
      id: `act-manual-initial-${Date.now()}`,
      name: `Hino Inicial Escola Sabatina: Hinário ${manual.initialHymn.number} - ${manual.initialHymn.title}`,
      responsible: 'Congregação (Manual da Escola Sabatina)',
      timeSlot: '09:05',
      durationMinutes: 4,
      section: 'escola_sabatina',
      category: 'louvor',
      completed: false,
      isRecurring: true,
      congregational1: initialMedia,
      notes: `Sugerido no Manual da ES: ${manual.lessonTitle}`,
    };
    if (welcomeIdx >= 0) {
      activities.splice(welcomeIdx + 1, 0, newInitial);
    } else {
      activities.unshift(newInitial);
    }
  }

  // 2. Final Hymn in Escola Sabatina
  const finalIdx = activities.findIndex(
    a => a.section === 'escola_sabatina' && a.name.toLowerCase().includes('hino final')
  );

  const finalMedia: MediaLink = {
    title: `Hinário ${manual.finalHymn.number} - ${manual.finalHymn.title}`,
    url: manual.finalHymn.youtubeUrl,
    note: `Hino de encerramento da ES • Manual da ES (${manual.quarter})`,
  };

  if (finalIdx >= 0) {
    const current = activities[finalIdx];
    if (overrideExisting || !current.congregational1 || !current.congregational1.title || current.name.includes('Manual')) {
      activities[finalIdx] = {
        ...current,
        name: `Hino Final Escola Sabatina: Hinário ${manual.finalHymn.number} - ${manual.finalHymn.title}`,
        responsible: 'Congregação (Manual da Escola Sabatina)',
        congregational1: finalMedia,
        isRecurring: true,
        notes: `Encerramento sugerido no Manual da ES: ${manual.lessonTitle}`,
      };
    }
  } else {
    const lessonIdx = activities.findIndex(
      a => a.section === 'escola_sabatina' && (a.name.toLowerCase().includes('lição') || a.name.toLowerCase().includes('licao'))
    );
    const newFinal: ActivityItem = {
      id: `act-manual-final-${Date.now()}`,
      name: `Hino Final Escola Sabatina: Hinário ${manual.finalHymn.number} - ${manual.finalHymn.title}`,
      responsible: 'Congregação (Manual da Escola Sabatina)',
      timeSlot: '10:05',
      durationMinutes: 4,
      section: 'escola_sabatina',
      category: 'louvor',
      completed: false,
      isRecurring: true,
      congregational1: finalMedia,
      notes: `Encerramento sugerido no Manual da ES: ${manual.lessonTitle}`,
    };
    if (lessonIdx >= 0) {
      activities.splice(lessonIdx + 1, 0, newFinal);
    } else {
      const lastEsIdx = activities.reduce((acc, a, idx) => a.section === 'escola_sabatina' ? idx : acc, -1);
      if (lastEsIdx >= 0) {
        activities.splice(lastEsIdx + 1, 0, newFinal);
      } else {
        activities.push(newFinal);
      }
    }
  }

  return {
    ...program,
    activities,
    updatedAt: new Date().toISOString(),
  };
}
