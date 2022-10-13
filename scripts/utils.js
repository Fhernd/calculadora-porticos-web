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
    this.tipoElemento = tipoElemento;
    this.longitud = longitud;
    this.cargaRepartida = cargaRepartida;
    this.cargasPuntuales = [];
    this.signo = this.establecerSigno();
    this.mcm = null;
    this.un = null;
    this.il = null;
    this.k = null;
  }

  establecerSigno() {
    this.signo = this.mf.replace('-', '');
    this.signo = this.signo.charCodeAt(0) < this.signo.charCodeAt(1) ? 1 : -1;

    if (['G-K', 'H-L', 'I-M', 'J-N', 'G-C', 'E-I', 'A-D', 'B-E', 'K-G', 'L-H', 'M-I', 'N-J', 'C-G', 'I-E', 'D-A', 'E-B']
      .indexOf(this.mf) !== -1) {
      this.signo *= -1;
    }

    return this.signo;
  }
}

class CargaPuntual {
  constructor(valor, longitudIzquierda, longitudDerecha) {
    this.valor = valor;
    this.longitudIzquierda = longitudIzquierda;
    this.longitudDerecha = longitudDerecha;
    this.esExcentrica = Boolean(this.longitudIzquierda);
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

function reverseString(s){
  return s.split("").reverse().join("");
}

function loadData(url, successCallback, errorCallback) {
  return new Promise((resolve, reject) => {
    $.ajax({
      method: 'GET',
      url: url,
      dataType: 'json',
      async: false
    }).done(successCallback).fail(errorCallback);
  });
}

function sonTodasCargasExcentricas(cargasPuntuales) {
  return cargasPuntuales.every(cargaPuntual => cargaPuntual.esExcentrica);
}

function contarCantidadMaximaDeCargasExcentricas(mfs) {
  const cargasPuntualesElementos = mfs.map(e => e.cargasPuntuales.length);
  return Math.max(...cargasPuntualesElementos);
}
