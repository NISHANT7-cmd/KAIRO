import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getStoredToken } from '../services/api';

export type SupportedLanguage = 
  | 'English'
  | 'Japanese'
  | 'Spanish'
  | 'French'
  | 'Hindi'
  | 'Marathi'
  | 'Korean'
  | 'German'
  | 'Portuguese';

export interface LanguageInfo {
  id: SupportedLanguage;
  code: string;
  label: string;
  native: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { id: 'English', code: 'en', label: 'English', native: 'English', flag: '🇺🇸' },
  { id: 'Japanese', code: 'ja', label: 'Japanese', native: '日本語', flag: '🇯🇵' },
  { id: 'Spanish', code: 'es', label: 'Spanish', native: 'Español', flag: '🇪🇸' },
  { id: 'French', code: 'fr', label: 'French', native: 'Français', flag: '🇫🇷' },
  { id: 'Hindi', code: 'hi', label: 'Hindi', native: 'हिंदी', flag: '🇮🇳' },
  { id: 'Marathi', code: 'mr', label: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
  { id: 'Korean', code: 'ko', label: 'Korean', native: '한국어', flag: '🇰🇷' },
  { id: 'German', code: 'de', label: 'German', native: 'Deutsch', flag: '🇩🇪' },
  { id: 'Portuguese', code: 'pt', label: 'Portuguese', native: 'Português', flag: '🇧🇷' },
];

export function detectSystemLanguage(): SupportedLanguage {
  try {
    const browserLangs = (typeof navigator !== 'undefined' && navigator.languages && navigator.languages.length > 0)
      ? navigator.languages
      : (typeof navigator !== 'undefined' && navigator.language ? [navigator.language] : []);

    for (const rawLang of browserLangs) {
      const code = rawLang.toLowerCase();
      if (code.startsWith('ja')) return 'Japanese';
      if (code.startsWith('es')) return 'Spanish';
      if (code.startsWith('fr')) return 'French';
      if (code.startsWith('ko')) return 'Korean';
      if (code.startsWith('mr')) return 'Marathi';
      if (code.startsWith('hi')) return 'Hindi';
      if (code.startsWith('de')) return 'German';
      if (code.startsWith('pt')) return 'Portuguese';
      if (code.startsWith('en')) return 'English';
    }
  } catch (e) {
    console.warn('[LanguageContext] Error detecting system language', e);
  }
  return 'English';
}

const TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  English: {
    nav_home: 'Home',
    nav_discover: 'Discover',
    nav_universes: 'Universes',
    nav_community: 'Community',
    nav_anime: 'Anime Hub',
    nav_studio: 'Creator Studio',
    nav_library: 'Reading Library',
    nav_profile: 'My Profile & Badges',
    nav_taste: 'Story DNA & Taste',
    nav_admin: 'Admin Dashboard',
    nav_search_placeholder: 'Search...',
    nav_signin: 'Sign In',
    nav_signup: 'Join KAIRO',
    nav_logout: 'Sign Out',
    nav_language: 'Language',
    
    home_personalized_title: 'Personalized For You',
    home_personalized_subtitle: 'Curated dynamically through your real-time Story DNA and reading behavior',
    home_tune_taste: 'Tune Taste',
    home_retake_onboarding: 'Retake Onboarding',
    home_trending_rail: 'Trending For You',
    home_trending_subtitle: 'Algorithmic picks tuned to your genre preferences and reading speed',
    home_anime_bridge_title: 'Screen to Serial: Anime Bridges',
    home_anime_bridge_subtitle: 'Serialized light novels resonant with your favorite anime aesthetics',
    home_not_interested: 'Not interested in this',
    home_hide_genre: 'Don\'t recommend this genre',
    home_mute_author: 'Mute this author',
    home_start_reading: 'Start Reading',
    home_continue_reading: 'Continue Reading',
    home_read_now: 'Read Now',
    home_explore_more: 'Explore All Stories',
    home_match_score: 'Match',
    home_filter_all: 'All Stories',
    home_live_readers: 'reading right now',
    home_available_in_lang: 'Available in',
    home_dna_active: 'Active Model',
    home_dna_persona: 'Reader Persona',

    taste_modal_title: 'Your Story DNA & Taste Profile',
    taste_modal_subtitle: 'Control how KAIRO recommends serialized stories, anime bridges, and creator universes.',
    taste_tab_dna: 'Story DNA',
    taste_tab_genres: 'Genres & Themes',
    taste_tab_languages: 'Languages & UX',
    taste_tab_privacy: 'Privacy & Muted',
    taste_save: 'Save Preferences',
    taste_saved: 'Taste updated successfully!',
    taste_reset: 'Reset to Default',
    taste_retake: 'Retake 7-Step Onboarding',
    taste_active_ui_lang: 'Interface Display Language',
    taste_reading_langs: 'Reading Content Languages',

    onboarding_welcome: 'Welcome to KAIRO',
    onboarding_desc: 'Let us build your personalized entertainment and storytelling experience.',
    onboarding_step_roles: 'Creative Identity',
    onboarding_step_formats: 'Story Formats',
    onboarding_step_genres: 'Genre Affinities',
    onboarding_step_tones: 'Narrative Tone',
    onboarding_step_anime: 'Anime Connections',
    onboarding_step_languages: 'Language & Cadence',
    onboarding_step_reveal: 'Your Story DNA',
    onboarding_next: 'Continue',
    onboarding_back: 'Back',
    onboarding_finish: 'Enter KAIRO',
  },
  Japanese: {
    nav_home: 'ホーム',
    nav_discover: '見つける',
    nav_universes: '世界観',
    nav_community: 'コミュニティ',
    nav_anime: 'アニメハブ',
    nav_studio: 'クリエイタースタジオ',
    nav_library: 'マイライブラリ',
    nav_profile: 'マイプロフィール＆バッジ',
    nav_taste: 'ストーリーDNA・好み',
    nav_admin: '管理者ダッシュボード',
    nav_search_placeholder: '検索...',
    nav_signin: 'ログイン',
    nav_signup: 'KAIROに参加',
    nav_logout: 'ログアウト',
    nav_language: '表示言語',

    home_personalized_title: 'あなたへの個別推薦',
    home_personalized_subtitle: 'リアルタイムのストーリーDNAと読書傾向に基づく厳選セレクション',
    home_tune_taste: '好みを調整',
    home_retake_onboarding: 'アンケート再受講',
    home_trending_rail: 'あなた向けトレンド',
    home_trending_subtitle: 'ジャンル傾向と読書ペースに合わせて最適化された作品',
    home_anime_bridge_title: 'アニメから原作小説へ：架け橋',
    home_anime_bridge_subtitle: 'お気に入りのアニメ世界観と響き合う連載ライトノベル',
    home_not_interested: 'この作品に興味がない',
    home_hide_genre: 'このジャンルを表示しない',
    home_mute_author: 'この著者をミュート',
    home_start_reading: '今すぐ読む',
    home_continue_reading: '続きから読む',
    home_read_now: '読む',
    home_explore_more: 'すべての作品を探す',
    home_match_score: '一致率',
    home_filter_all: 'すべての作品',
    home_live_readers: '人が現在読書中',
    home_available_in_lang: '対応言語',
    home_dna_active: '適応中モデル',
    home_dna_persona: '読者ペルソナ',

    taste_modal_title: 'ストーリーDNAと好みの設定',
    taste_modal_subtitle: 'KAIROが提案する作品・世界観・アニメの推薦ロジックを微調整できます。',
    taste_tab_dna: 'ストーリーDNA',
    taste_tab_genres: 'ジャンルとテーマ',
    taste_tab_languages: '言語・UI設定',
    taste_tab_privacy: 'プライバシー・ミュート',
    taste_save: '設定を保存',
    taste_saved: '好みを更新しました！',
    taste_reset: '初期設定に戻す',
    taste_retake: '7問のアンケートを再開',
    taste_active_ui_lang: '画面の表示言語',
    taste_reading_langs: '作品の読書言語',

    onboarding_welcome: 'KAIROへようこそ',
    onboarding_desc: 'あなただけの物語体験とパーソナライズされた空間を構築しましょう。',
    onboarding_step_roles: '参加スタイル',
    onboarding_step_formats: '物語の形式',
    onboarding_step_genres: 'ジャンルの好み',
    onboarding_step_tones: '物語のトーン',
    onboarding_step_anime: 'アニメとの繋がり',
    onboarding_step_languages: '言語と読書ペース',
    onboarding_step_reveal: 'あなたのストーリーDNA',
    onboarding_next: '次へ',
    onboarding_back: '戻る',
    onboarding_finish: 'KAIROを始める',
  },
  Spanish: {
    nav_home: 'Inicio',
    nav_discover: 'Descubrir',
    nav_universes: 'Universos',
    nav_community: 'Comunidad',
    nav_anime: 'Anime Hub',
    nav_studio: 'Estudio Creador',
    nav_library: 'Mi Biblioteca',
    nav_profile: 'Mi Perfil & Insignias',
    nav_taste: 'ADN de Historias & Gustos',
    nav_admin: 'Panel de Administración',
    nav_search_placeholder: 'Buscar...',
    nav_signin: 'Iniciar Sesión',
    nav_signup: 'Unirse a KAIRO',
    nav_logout: 'Cerrar Sesión',
    nav_language: 'Idioma',

    home_personalized_title: 'Personalizado Para Ti',
    home_personalized_subtitle: 'Curado dinámicamente con tu ADN de historias y hábitos de lectura en tiempo real',
    home_tune_taste: 'Ajustar Gustos',
    home_retake_onboarding: 'Rehacer Cuestionario',
    home_trending_rail: 'Tendencias Para Ti',
    home_trending_subtitle: 'Selecciones algorítmicas sintonizadas con tus géneros y velocidad de lectura',
    home_anime_bridge_title: 'De la Pantalla a la Novela: Puentes Anime',
    home_anime_bridge_subtitle: 'Novelas ligeras serializadas inspiradas en la estética de tus animes favoritos',
    home_not_interested: 'No me interesa esta historia',
    home_hide_genre: 'No recomendar este género',
    home_mute_author: 'Silenciar a este autor',
    home_start_reading: 'Comenzar a Leer',
    home_continue_reading: 'Continuar Leyendo',
    home_read_now: 'Leer Ahora',
    home_explore_more: 'Explorar Todo el Catálogo',
    home_match_score: 'Coincidencia',
    home_filter_all: 'Todas las Historias',
    home_live_readers: 'leyendo ahora',
    home_available_in_lang: 'Disponible en',
    home_dna_active: 'Modelo Activo',
    home_dna_persona: 'Perfil Lector',

    taste_modal_title: 'Tu ADN de Historias y Preferencias',
    taste_modal_subtitle: 'Controla cómo KAIRO recomienda novelas, puentes de anime y universos creativos.',
    taste_tab_dna: 'ADN Narrativo',
    taste_tab_genres: 'Géneros y Temas',
    taste_tab_languages: 'Idiomas e Interfaz',
    taste_tab_privacy: 'Privacidad y Silenciados',
    taste_save: 'Guardar Preferencias',
    taste_saved: '¡Preferencias actualizadas con éxito!',
    taste_reset: 'Restablecer por Defecto',
    taste_retake: 'Rehacer Onboarding',
    taste_active_ui_lang: 'Idioma de la Pantalla',
    taste_reading_langs: 'Idiomas de Lectura',

    onboarding_welcome: 'Bienvenido a KAIRO',
    onboarding_desc: 'Construyamos tu experiencia de lectura y narración personalizada.',
    onboarding_step_roles: 'Identidad Creativa',
    onboarding_step_formats: 'Formatos de Historia',
    onboarding_step_genres: 'Afinidad de Géneros',
    onboarding_step_tones: 'Tono Narrativo',
    onboarding_step_anime: 'Conexión Anime',
    onboarding_step_languages: 'Idioma y Ritmo',
    onboarding_step_reveal: 'Tu ADN de Historias',
    onboarding_next: 'Continuar',
    onboarding_back: 'Atrás',
    onboarding_finish: 'Entrar a KAIRO',
  },
  French: {
    nav_home: 'Accueil',
    nav_discover: 'Découvrir',
    nav_universes: 'Univers',
    nav_community: 'Communauté',
    nav_anime: 'Pôle Anime',
    nav_studio: 'Studio Créateur',
    nav_library: 'Ma Bibliothèque',
    nav_profile: 'Mon Profil & Badges',
    nav_taste: 'ADN Narratif & Goûts',
    nav_admin: 'Tableau de Bord Admin',
    nav_search_placeholder: 'Rechercher...',
    nav_signin: 'Connexion',
    nav_signup: 'Rejoindre KAIRO',
    nav_logout: 'Déconnexion',
    nav_language: 'Langue',

    home_personalized_title: 'Personnalisé Pour Vous',
    home_personalized_subtitle: 'Sélection dynamique selon votre ADN narratif et vos habitudes de lecture',
    home_tune_taste: 'Ajuster les Goûts',
    home_retake_onboarding: 'Refaire le Questionnaire',
    home_trending_rail: 'Tendances Pour Vous',
    home_trending_subtitle: 'Recommandations ciblées selon vos genres préférés et votre cadence',
    home_anime_bridge_title: 'De l\'Écran au Roman : Passerelles Anime',
    home_anime_bridge_subtitle: 'Romans feuilletons inspirés par vos univers d\'anime préférés',
    home_not_interested: 'Pas intéressé par cette histoire',
    home_hide_genre: 'Ne plus recommander ce genre',
    home_mute_author: 'Masquer cet auteur',
    home_start_reading: 'Commencer la Lecture',
    home_continue_reading: 'Reprendre la Lecture',
    home_read_now: 'Lire',
    home_explore_more: 'Explorer Tout le Catalogue',
    home_match_score: 'Affinité',
    home_filter_all: 'Toutes les Histoires',
    home_live_readers: 'en train de lire',
    home_available_in_lang: 'Disponible en',
    home_dna_active: 'Modèle Actif',
    home_dna_persona: 'Persona de Lecture',

    taste_modal_title: 'Votre ADN Narratif & Profil de Goûts',
    taste_modal_subtitle: 'Personnalisez les recommandations d\'histoires, d\'animes et d\'univers sur KAIRO.',
    taste_tab_dna: 'ADN Narratif',
    taste_tab_genres: 'Genres & Thèmes',
    taste_tab_languages: 'Langues & Interface',
    taste_tab_privacy: 'Confidentialité & Masqués',
    taste_save: 'Enregistrer les Préférences',
    taste_saved: 'Préférences mises à jour !',
    taste_reset: 'Rétablir par Défaut',
    taste_retake: 'Refaire le Questionnaire',
    taste_active_ui_lang: 'Langue de l\'Interface',
    taste_reading_langs: 'Langues de Lecture',

    onboarding_welcome: 'Bienvenue sur KAIRO',
    onboarding_desc: 'Créons ensemble votre univers de lecture et d\'histoires sur mesure.',
    onboarding_step_roles: 'Identité Créative',
    onboarding_step_formats: 'Formats de Récit',
    onboarding_step_genres: 'Affinités de Genre',
    onboarding_step_tones: 'Tonalité',
    onboarding_step_anime: 'Passerelles Anime',
    onboarding_step_languages: 'Langues & Cadence',
    onboarding_step_reveal: 'Votre ADN Narratif',
    onboarding_next: 'Continuer',
    onboarding_back: 'Retour',
    onboarding_finish: 'Entrer dans KAIRO',
  },
  Hindi: {
    nav_home: 'होम',
    nav_discover: 'खोजें',
    nav_universes: 'ब्रह्मांड',
    nav_community: 'समुदाय',
    nav_anime: 'एनीमे हब',
    nav_studio: 'क्रिएटर स्टूडियो',
    nav_library: 'मेरी लाइब्रेरी',
    nav_profile: 'मेरा प्रोफ़ाइल और बैज',
    nav_taste: 'कहानी डीएनए और पसंद',
    nav_admin: 'एडमिन पैनल',
    nav_search_placeholder: 'खोजें...',
    nav_signin: 'साइन इन',
    nav_signup: 'KAIRO से जुड़ें',
    nav_logout: 'लॉग आउट',
    nav_language: 'भाषा',

    home_personalized_title: 'आपके लिए विशेष सिफारिशें',
    home_personalized_subtitle: 'आपके कहानी डीएनए और पढ़ने के स्वभाव के अनुसार व्यक्तिगत चयन',
    home_tune_taste: 'पसंद समायोजित करें',
    home_retake_onboarding: 'प्रश्नावली दोबारा भरें',
    home_trending_rail: 'आपके लिए ट्रेंडिंग',
    home_trending_subtitle: 'आपकी पसंदीदा शैलियों और पढ़ने की गति के अनुसार चुनी गई कहानियाँ',
    home_anime_bridge_title: 'एनीमे से उपन्यास: सेतु',
    home_anime_bridge_subtitle: 'आपके पसंदीदा एनीमे की दुनिया से जुड़े धारावाहिक उपन्यास',
    home_not_interested: 'इसमें रुचि नहीं है',
    home_hide_genre: 'इस शैली की सिफारिश न करें',
    home_mute_author: 'इस लेखक को म्यूट करें',
    home_start_reading: 'पढ़ना शुरू करें',
    home_continue_reading: 'आगे पढ़ें',
    home_read_now: 'पढ़ें',
    home_explore_more: 'सभी कहानियाँ देखें',
    home_match_score: 'मिलान',
    home_filter_all: 'सभी कहानियाँ',
    home_live_readers: 'अभी पढ़ रहे हैं',
    home_available_in_lang: 'उपलब्ध भाषा',
    home_dna_active: 'सक्रिय मॉडल',
    home_dna_persona: 'पाठक व्यक्तित्व',

    taste_modal_title: 'आपका कहानी डीएनए और पसंद',
    taste_modal_subtitle: 'नियंत्रित करें कि KAIRO आपको कहानियाँ और एनीमे कैसे सुझाए।',
    taste_tab_dna: 'कहानी डीएनए',
    taste_tab_genres: 'शैलियाँ और विषय',
    taste_tab_languages: 'भाषा और इंटरफ़ेस',
    taste_tab_privacy: 'गोपनीयता और म्यूट',
    taste_save: 'पसंद सहेजें',
    taste_saved: 'पसंद सफलतापूर्वक अपडेट की गई!',
    taste_reset: 'डिफ़ॉल्ट पर रीसेट करें',
    taste_retake: '7-चरणीय प्रश्नावली पुनः भरें',
    taste_active_ui_lang: 'इंटरफ़ेस भाषा',
    taste_reading_langs: 'पढ़ने की भाषाएँ',

    onboarding_welcome: 'KAIRO में आपका स्वागत है',
    onboarding_desc: 'आइए आपके लिए एक व्यक्तिगत कहानी और पठन अनुभव तैयार करें।',
    onboarding_step_roles: 'रचनात्मक पहचान',
    onboarding_step_formats: 'कहानी के प्रकार',
    onboarding_step_genres: 'पसंदीदा शैलियाँ',
    onboarding_step_tones: 'कहानी का भाव',
    onboarding_step_anime: 'एनीमे संबंध',
    onboarding_step_languages: 'भाषा और गति',
    onboarding_step_reveal: 'आपका कहानी डीएनए',
    onboarding_next: 'आगे बढ़ें',
    onboarding_back: 'पीछे',
    onboarding_finish: 'KAIRO में प्रवेश करें',
  },
  Marathi: {
    nav_home: 'मुखपृष्ठ',
    nav_discover: 'शोधा',
    nav_universes: 'विश्व',
    nav_community: 'समुदाय',
    nav_anime: 'अ‍ॅनिमे हब',
    nav_studio: 'निर्माता स्टुडिओ',
    nav_library: 'माझे ग्रंथालय',
    nav_profile: 'माझे प्रोफाइल आणि बॅज',
    nav_taste: 'कथा डीएनए आणि आवड',
    nav_admin: 'प्रशासक फलक',
    nav_search_placeholder: 'शोधा...',
    nav_signin: 'साइन इन',
    nav_signup: 'KAIRO मध्ये सामील व्हा',
    nav_logout: 'लॉग आउट',
    nav_language: 'भाषा',

    home_personalized_title: 'तुमच्यासाठी सानुकूलित कथा',
    home_personalized_subtitle: 'तुमच्या कथा डीएनए आणि वाचन शैलीवर आधारित निवडक संग्रह',
    home_tune_taste: 'आवड जुळवा',
    home_retake_onboarding: 'प्रश्नावली पुन्हा भरा',
    home_trending_rail: 'तुमच्यासाठी ट्रेंडिंग',
    home_trending_subtitle: 'तुमच्या आवडीच्या शैलीनुसार निवडलेल्या धारावाहिक कथा',
    home_anime_bridge_title: 'अ‍ॅनिमे ते कादंबरी: दुवा',
    home_anime_bridge_subtitle: 'तुमच्या आवडत्या अ‍ॅनिमेवर आधारित हलक्या कादंबऱ्या',
    home_not_interested: 'यात स्वारस्य नाही',
    home_hide_genre: 'हा प्रकार सुचवू नका',
    home_mute_author: 'या लेखकाला म्यूट करा',
    home_start_reading: 'वाचायला सुरू करा',
    home_continue_reading: 'पुढे वाचा',
    home_read_now: 'वाचा',
    home_explore_more: 'सर्व कथा एक्सप्लोर करा',
    home_match_score: 'जुळणी',
    home_filter_all: 'सर्व कथा',
    home_live_readers: 'सध्या वाचत आहेत',
    home_available_in_lang: 'उपलब्ध भाषा',
    home_dna_active: 'सक्रिय मॉडेल',
    home_dna_persona: 'वाचक व्यक्तिमत्त्व',

    taste_modal_title: 'तुमचा कथा डीएनए आणि प्राधान्ये',
    taste_modal_subtitle: 'KAIRO वरील कथा शिफारसींवर तुमचे संपूर्ण नियंत्रण ठेवा.',
    taste_tab_dna: 'कथा डीएनए',
    taste_tab_genres: 'शैली आणि विषय',
    taste_tab_languages: 'भाषा आणि इंटरफेस',
    taste_tab_privacy: 'गोपनीयता',
    taste_save: 'बदल जतन करा',
    taste_saved: 'प्राधान्ये यशस्वीरित्या अद्यतनित!',
    taste_reset: 'पुन्हा पूर्ववत करा',
    taste_retake: 'ऑनबोर्डिंग पुन्हा सुरू करा',
    taste_active_ui_lang: 'इंटरफेस भाषा',
    taste_reading_langs: 'वाचनाच्या भाषा',

    onboarding_welcome: 'KAIRO मध्ये स्वागत आहे',
    onboarding_desc: 'तुमच्या आवडीनुसार वैयक्तिक वाचन अनुभव तयार करूया.',
    onboarding_step_roles: 'सर्जनशील ओळख',
    onboarding_step_formats: 'कथा स्वरूप',
    onboarding_step_genres: 'आवडत्या शैली',
    onboarding_step_tones: 'कथेचा सूर',
    onboarding_step_anime: 'अ‍ॅनिमे आवड',
    onboarding_step_languages: 'भाषा आणि वाचन गती',
    onboarding_step_reveal: 'तुमचा कथा डीएनए',
    onboarding_next: 'पुढे चला',
    onboarding_back: 'मागे',
    onboarding_finish: 'KAIRO सुरू करा',
  },
  Korean: {
    nav_home: '홈',
    nav_discover: '탐색',
    nav_universes: '세계관',
    nav_community: '커뮤니티',
    nav_anime: '애니 허브',
    nav_studio: '크리에이터 스튜디오',
    nav_library: '내 서재',
    nav_profile: '내 프로필 & 뱃지',
    nav_taste: '스토리 DNA & 취향',
    nav_admin: '관리자 대시보드',
    nav_search_placeholder: '검색...',
    nav_signin: '로그인',
    nav_signup: 'KAIRO 시작하기',
    nav_logout: '로그아웃',
    nav_language: '언어',

    home_personalized_title: '회원님을 위한 맞춤 추천',
    home_personalized_subtitle: '실시간 스토리 DNA와 독서 습관을 바탕으로 큐레이션된 작품들',
    home_tune_taste: '취향 조정',
    home_retake_onboarding: '온보딩 다시하기',
    home_trending_rail: '나를 위한 트렌드',
    home_trending_subtitle: '선호 장르와 독서 속도에 최적화된 알고리즘 추천작',
    home_anime_bridge_title: '스크린에서 소설로: 애니 브릿지',
    home_anime_bridge_subtitle: '좋아하는 애니메이션 감성과 이어지는 오리지널 라이트 노벨',
    home_not_interested: '관심 없는 스토리입니다',
    home_hide_genre: '이 장르 추천 안 함',
    home_mute_author: '이 작가 숨기기',
    home_start_reading: '지금 읽기',
    home_continue_reading: '이어 읽기',
    home_read_now: '읽기',
    home_explore_more: '모든 작품 둘러보기',
    home_match_score: '일치율',
    home_filter_all: '모든 스토리',
    home_live_readers: '명이 지금 읽는 중',
    home_available_in_lang: '지원 언어',
    home_dna_active: '적용된 모델',
    home_dna_persona: '독자 페르소나',

    taste_modal_title: '내 스토리 DNA & 취향 프로필',
    taste_modal_subtitle: 'KAIRO가 연재 소설과 애니메이션 브릿지를 추천하는 방식을 직접 제어하세요.',
    taste_tab_dna: '스토리 DNA',
    taste_tab_genres: '장르 & 테마',
    taste_tab_languages: '언어 & UX',
    taste_tab_privacy: '개인정보 & 차단',
    taste_save: '설정 저장',
    taste_saved: '취향이 업데이트되었습니다!',
    taste_reset: '초기화',
    taste_retake: '7단계 설문 다시하기',
    taste_active_ui_lang: '화면 표시 언어',
    taste_reading_langs: '작품 독서 언어',

    onboarding_welcome: 'KAIRO에 오신 것을 환영합니다',
    onboarding_desc: '회원님만의 맞춤형 엔터테인먼트 및 스토리텔링 경험을 만들어보세요.',
    onboarding_step_roles: '창작 정체성',
    onboarding_step_formats: '스토리 형식',
    onboarding_step_genres: '선호 장르',
    onboarding_step_tones: '서사 분위기',
    onboarding_step_anime: '애니메이션 취향',
    onboarding_step_languages: '언어 및 독서 주기',
    onboarding_step_reveal: '내 스토리 DNA',
    onboarding_next: '계속하기',
    onboarding_back: '이전',
    onboarding_finish: 'KAIRO 시작하기',
  },
  German: {
    nav_home: 'Startseite',
    nav_discover: 'Entdecken',
    nav_universes: 'Universen',
    nav_community: 'Gemeinschaft',
    nav_anime: 'Anime-Hub',
    nav_studio: 'Autoren-Studio',
    nav_library: 'Meine Bibliothek',
    nav_profile: 'Mein Profil & Abzeichen',
    nav_taste: 'Story-DNA & Geschmack',
    nav_admin: 'Admin-Dashboard',
    nav_search_placeholder: 'Suchen...',
    nav_signin: 'Anmelden',
    nav_signup: 'KAIRO beitreten',
    nav_logout: 'Abmelden',
    nav_language: 'Sprache',

    home_personalized_title: 'Für Dich Personalisiert',
    home_personalized_subtitle: 'Kuratiert basierend auf deiner Echtzeit-Story-DNA und Lesegewohnheiten',
    home_tune_taste: 'Vorlieben anpassen',
    home_retake_onboarding: 'Onboarding wiederholen',
    home_trending_rail: 'Trends Für Dich',
    home_trending_subtitle: 'Algorithmische Empfehlungen passend zu deinen Lieblingsgenres',
    home_anime_bridge_title: 'Vom Bildschirm zum Roman: Anime-Brücken',
    home_anime_bridge_subtitle: 'Fortlaufende Light Novels passend zu deiner Anime-Ästhetik',
    home_not_interested: 'Nicht interessiert',
    home_hide_genre: 'Dieses Genre nicht empfehlen',
    home_mute_author: 'Diesen Autor stummschalten',
    home_start_reading: 'Jetzt lesen',
    home_continue_reading: 'Weiterlesen',
    home_read_now: 'Lesen',
    home_explore_more: 'Alle Geschichten entdecken',
    home_match_score: 'Übereinstimmung',
    home_filter_all: 'Alle Geschichten',
    home_live_readers: 'lesen gerade',
    home_available_in_lang: 'Verfügbar auf',
    home_dna_active: 'Aktives Modell',
    home_dna_persona: 'Leser-Persona',

    taste_modal_title: 'Deine Story-DNA & Geschmacksprofil',
    taste_modal_subtitle: 'Steuere, wie KAIRO dir Geschichten, Anime-Brücken und Universen empfiehlt.',
    taste_tab_dna: 'Story-DNA',
    taste_tab_genres: 'Genres & Themen',
    taste_tab_languages: 'Sprachen & UX',
    taste_tab_privacy: 'Privatsphäre & Stumm',
    taste_save: 'Einstellungen speichern',
    taste_saved: 'Geschmacksprofil aktualisiert!',
    taste_reset: 'Auf Standard zurücksetzen',
    taste_retake: '7-Schritte-Fragebogen wiederholen',
    taste_active_ui_lang: 'Oberflächensprache',
    taste_reading_langs: 'Lesesprachen',

    onboarding_welcome: 'Willkommen bei KAIRO',
    onboarding_desc: 'Lass uns dein persönliches Lese- und Storytelling-Erlebnis aufbauen.',
    onboarding_step_roles: 'Kreative Identität',
    onboarding_step_formats: 'Story-Formate',
    onboarding_step_genres: 'Genre-Vorlieben',
    onboarding_step_tones: 'Erzählton',
    onboarding_step_anime: 'Anime-Favoriten',
    onboarding_step_languages: 'Sprache & Rhythmus',
    onboarding_step_reveal: 'Deine Story-DNA',
    onboarding_next: 'Weiter',
    onboarding_back: 'Zurück',
    onboarding_finish: 'KAIRO betreten',
  },
  Portuguese: {
    nav_home: 'Início',
    nav_discover: 'Descobrir',
    nav_universes: 'Universos',
    nav_community: 'Comunidade',
    nav_anime: 'Hub Anime',
    nav_studio: 'Estúdio Criador',
    nav_library: 'Minha Biblioteca',
    nav_profile: 'Meu Perfil & Emblemas',
    nav_taste: 'DNA de Histórias & Gostos',
    nav_admin: 'Painel do Administrador',
    nav_search_placeholder: 'Buscar...',
    nav_signin: 'Entrar',
    nav_signup: 'Junte-se ao KAIRO',
    nav_logout: 'Sair',
    nav_language: 'Idioma',

    home_personalized_title: 'Personalizado Para Você',
    home_personalized_subtitle: 'Curadoria dinâmica através do seu DNA de histórias e hábitos de leitura',
    home_tune_taste: 'Ajustar Preferências',
    home_retake_onboarding: 'Refazer Onboarding',
    home_trending_rail: 'Em Alta Para Você',
    home_trending_subtitle: 'Recomendações algorítmicas sintonizadas com seus gêneros e velocidade de leitura',
    home_anime_bridge_title: 'Da Tela ao Romance: Pontes Anime',
    home_anime_bridge_subtitle: 'Light novels seriadas inspiradas nas estéticas dos seus animes favoritos',
    home_not_interested: 'Não tenho interesse',
    home_hide_genre: 'Não recomendar este gênero',
    home_mute_author: 'Silenciar este autor',
    home_start_reading: 'Começar a Ler',
    home_continue_reading: 'Continuar Lendo',
    home_read_now: 'Ler Agora',
    home_explore_more: 'Explorar Todas as Histórias',
    home_match_score: 'Afinidade',
    home_filter_all: 'Todas as Histórias',
    home_live_readers: 'lendo agora',
    home_available_in_lang: 'Disponível em',
    home_dna_active: 'Modelo Ativo',
    home_dna_persona: 'Perfil Leitor',

    taste_modal_title: 'Seu DNA de Histórias & Perfil de Gosto',
    taste_modal_subtitle: 'Controle como o KAIRO recomenda histórias, conexões de anime e universos.',
    taste_tab_dna: 'DNA Narrativo',
    taste_tab_genres: 'Gêneros & Temas',
    taste_tab_languages: 'Idiomas & Interface',
    taste_tab_privacy: 'Privacidade & Silenciados',
    taste_save: 'Salvar Preferências',
    taste_saved: 'Preferências salvas com sucesso!',
    taste_reset: 'Restaurar Padrão',
    taste_retake: 'Refazer Questionário de 7 Passos',
    taste_active_ui_lang: 'Idioma da Interface',
    taste_reading_langs: 'Idiomas de Leitura',

    onboarding_welcome: 'Bem-vindo ao KAIRO',
    onboarding_desc: 'Vamos construir sua experiência de leitura e narrativa personalizada.',
    onboarding_step_roles: 'Identidade Criativa',
    onboarding_step_formats: 'Formatos de História',
    onboarding_step_genres: 'Afinidades de Gênero',
    onboarding_step_tones: 'Tom Narrativo',
    onboarding_step_anime: 'Conexões de Anime',
    onboarding_step_languages: 'Idioma e Ritmo',
    onboarding_step_reveal: 'Seu DNA Narrativo',
    onboarding_next: 'Continuar',
    onboarding_back: 'Voltar',
    onboarding_finish: 'Entrar no KAIRO',
  },
};

interface LanguageContextType {
  currentLanguage: SupportedLanguage;
  currentLanguageInfo: LanguageInfo;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  t: (key: string, fallback?: string) => string;
  supportedLanguages: LanguageInfo[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguageState] = useState<SupportedLanguage>(() => {
    const saved = localStorage.getItem('kairo_ui_language');
    if (saved && SUPPORTED_LANGUAGES.some(l => l.id === saved)) {
      return saved as SupportedLanguage;
    }
    // Auto set context language to their system or regional language
    return detectSystemLanguage();
  });

  const currentLanguageInfo = SUPPORTED_LANGUAGES.find(l => l.id === currentLanguage) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    // Keep document lang attribute in sync
    document.documentElement.lang = currentLanguageInfo.code;
  }, [currentLanguageInfo]);

  const setLanguage = async (lang: SupportedLanguage) => {
    setCurrentLanguageState(lang);
    localStorage.setItem('kairo_ui_language', lang);
    const langInfo = SUPPORTED_LANGUAGES.find(l => l.id === lang) || SUPPORTED_LANGUAGES[0];
    document.documentElement.lang = langInfo.code;

    // Dispatch global event for listeners (e.g. HomeView to reload personalized feed)
    window.dispatchEvent(new CustomEvent('kairo:language-changed', { detail: { language: lang } }));

    // Synchronize with logged-in user profile if token is present
    const token = getStoredToken();
    if (token) {
      try {
        await api.updateTasteProfile({
          preferredUiLanguage: lang,
        });
      } catch (e) {
        console.warn('[LanguageContext] Failed to persist preferredUiLanguage to backend profile', e);
      }
    }
  };

  const t = (key: string, fallback?: string): string => {
    const dict = TRANSLATIONS[currentLanguage] || TRANSLATIONS.English;
    if (dict[key]) {
      return dict[key];
    }
    const englishDict = TRANSLATIONS.English;
    if (englishDict[key]) {
      return englishDict[key];
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        currentLanguageInfo,
        setLanguage,
        t,
        supportedLanguages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}
