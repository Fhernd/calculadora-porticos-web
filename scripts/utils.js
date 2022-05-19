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
        this.fechaHora = moment().format('YYYY-MM-DDTHH:mm:ss.SSS');
        this.cargasPuntuales = [];
    }

    esExcentrica() {
        return Boolean(this.longitudIzquierda);
    }
}

class CargaPuntual {
  constructor(valor, longitudIzquierda, longitudDerecha) {
    this.valor = valor;
    this.longitudIzquierda = longitudIzquierda;
    this.longitudDerecha = longitudDerecha;
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
    numeros.forEach(function(n) {
        multiplo = mcm(multiplo, n);
    });

    return multiplo;
}

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
