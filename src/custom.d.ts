// Объявление для SCSS модулей
declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}

// Объявление для CSS модулей
declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

// Объявление для PNG картинок
declare module '*.png' {
  const content: string;
  export default content;
}