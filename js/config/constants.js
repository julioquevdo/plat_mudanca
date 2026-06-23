// Layer 1 — Config
// Application-wide constants and enums.

export const XP_POR_CHECK = 10;
export const XP_DIA_RUIM = XP_POR_CHECK;

export const MARCOS_VOLUME = [10, 25, 50, 100];

export const LIMITE_COMPROMISSOS_SUGERIDO = 3;

export const TEMAS = [
  {
    id: 'sage',
    nome: 'Verde Clássico',
    classe: 'theme-sage',
    nivelMinimo: 1,
    cores: ['#7EB89A', '#A393C8'],
  },
  {
    id: 'ocean',
    nome: 'Azul Oceano',
    classe: 'theme-ocean',
    nivelMinimo: 2,
    cores: ['#5FAEC0', '#7EB89A'],
  },
  {
    id: 'lavender',
    nome: 'Lilás Suave',
    classe: 'theme-lavender',
    nivelMinimo: 3,
    cores: ['#A393C8', '#E2B35A'],
  },
  {
    id: 'orange',
    nome: 'Laranja Outono',
    classe: 'theme-orange',
    nivelMinimo: 4,
    cores: ['#D4A853', '#C4856A'],
  },
  {
    id: 'dark',
    nome: 'Escuro Profundo',
    classe: 'theme-dark',
    nivelMinimo: 5,
    cores: ['#E8F0F8', '#5A6880'],
  },
];

export const NIVEIS = [
  { min: 0,   max: 49,  nivel: 1, nome: 'Semente' },
  { min: 50,  max: 149, nivel: 2, nome: 'Broto'   },
  { min: 150, max: 299, nivel: 3, nome: 'Muda'    },
  { min: 300, max: 499, nivel: 4, nome: 'Raiz'    },
  { min: 500, max: 799, nivel: 5, nome: 'Galho'   },
  { min: 800, max: Infinity, nivel: 6, nome: 'Árvore' },
];

export const SENSACOES = [
  { value: 'tedio',       label: 'Tédio',       emoji: '😐' },
  { value: 'ansiedade',   label: 'Ansiedade',   emoji: '😰' },
  { value: 'indiferenca', label: 'Indiferença', emoji: '😶' },
  { value: 'satisfacao',  label: 'Satisfação',  emoji: '😌' },
  { value: 'cansaco',     label: 'Cansaço',     emoji: '😴' },
];

export const FREQUENCIA_TIPOS = {
  DIARIA:         'diaria',
  DIAS_SEMANA:    'diasSemana',
  X_VEZES_SEMANA: 'xVezesSemana',
};

export const CHECK_STATUS = {
  CUMPRIDO:     'cumprido',
  NAO_CUMPRIDO: 'naoCumprido',
  PAUSADO:      'pausado',
};

export const STREAK_ESTADO = {
  ATIVO:    'ativo',
  PENDENTE: 'pendente',
  ZERADO:   'zerado',
};

export const DIAS_SEMANA = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
];

export const CORES_CATEGORIA = [
  '#6A9F7E', '#9B8BB4', '#D4A853', '#7CA8C0',
  '#C4856A', '#8BA87C', '#A87CA8', '#7C8BA8',
];

export const REVISAO_DIA_DEFAULT = 0; // Domingo

export const MAX_CHARS_DIARIO = 280;
export const MAX_CHARS_CONTEXTO = 200;
export const MAX_CHARS_FRASE_ANCORAGEM = 120;
