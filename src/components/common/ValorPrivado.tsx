import React from 'react';

interface ValorPrivadoProps {
  valor: string | number;
  esPrivado: boolean;
  textoMascara?: string;
  className?: string;
}

export const ValorPrivado: React.FC<ValorPrivadoProps> = ({
  valor,
  esPrivado,
  textoMascara = 'J8hd 4',
  className = ''
}) => {
  return (
    <span 
      className={`inline-block transition-all duration-300 ${
        esPrivado 
          ? 'filter blur-[5px] select-none opacity-60' 
          : 'filter blur-0 opacity-100'
      } ${className}`}
    >
      {esPrivado ? textoMascara : valor}
    </span>
  );
};
