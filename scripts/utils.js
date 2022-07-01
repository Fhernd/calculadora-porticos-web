class Elemento {
  constructor(id, tipo, B, H) {
    this.id = id;
    this.tipo = tipo;
    this.B = B;
    this.H = H;
    this.I = null;
    this.UN = null;
  }
}

class MF {
  constructor(mf, tipoElemento, longitud, cargaRepartida) {
    this.mf = mf;
    this.longitud = longitud;
    this.cargaRepartida = cargaRepartida;
    this.cargasPuntuales = [];
  }

  signo() {
    const mf = this.mf.replace('-', '');
    return mf.charCodeAt(0) < mf.charCodeAt(1) ? 1 : -1;
  }
}

class CargaPuntual {
  constructor(valor, longitudIzquierda, longitudDerecha) {
    this.valor = valor;
    this.longitudIzquierda = longitudIzquierda;
    this.longitudDerecha = longitudDerecha;
  }

  esExcentrica() {
    return Boolean(this.longitudIzquierda);
  }
}

function calcularMinimoComunMultiplo(numeros) {

  function mcd(a, b) {
    return !b ? a : mcd(b, a % b);
  }

  function mcm(a, b) {
    return (a * b) / mcd(a, b);
  }

  let multiplo = numeros[0];
  numeros.forEach(function (n) {
    multiplo = mcm(multiplo, n);
  });

  return multiplo;
}

function establecerAlMenosNDecimales(valor, decimales = 3) {
  return Number.parseFloat(valor).toFixed(decimales);
}

function isNaNOrNullOrUndefined(valor) {
  return !Boolean(valor);
}

function isEmptyString(valor) {
  return !Boolean(valor.trim().length);
}
