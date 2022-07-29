let data = {};
let tblMfs = null;
let tblMfsCalculosElasticidad = null;
let sumatoriasMfs = null;
let sumatoriasMfsModulosElasticidad = null;

/**
 * Una vez se cargue el navegador, se inicializa la aplicación.
 */
$(() => {
  init();

  $('#frmInicioCapturaDatos').on('submit', iniciarCapturaDatos);
  $('#btnAgregarElemento').on('click', agregarElemento);
  $('#btnGuardarElemento').on('click', guardarElemento);
  $('#btnAgregarNuevoMF').on('click', agregarMF);
  $('#btnCrearCargaPuntual').on('click', crearCargaPuntual)
  $('#btnGuardarMf').on('click', guardarMf);
  $('#btnGenerarTablaIteracion').on('click', generarTablasIteraciones);

  $('#E').focus();
});

/**
 * Inicializa los componentes de la interfaz gráfica.
 */
function init() {
  $('.mf').hide();
  $('.data').hide();
  $('.captura').hide();
  $('.elemento').hide();
  $('.row-elementos').hide();
  $('.hr-elementos').hide();
  $('.hr-mfs').show();
  $('.row-mfs').show();
  tblMfs = $('#tblMfs').DataTable({
    paging: false,
    ordering: false,
    info: false,
    searching: false
  });
  tblMfsCalculosElasticidad = $('#tblMfsCalculosElasticidad').DataTable({
    paging: false,
    ordering: false,
    info: false,
    searching: false
  });

  data = {
    elementos: [],
    mfs: []
  };
}

/**
 * Inicia la captura de datos.
 * @param event Información del evento del botón que inicia la captura de datos.
 */
function iniciarCapturaDatos(event) {
  event.preventDefault();

  $('#btnIniciarCaptura').hide();
  const E = $('#E');
  const Fy = $('#Fy');
  data['fc'] = parseInt(E.val());
  const unidadMedida = $('input[name="unidadMedida"]');

  E.prop('disabled', true);
  unidadMedida.prop('disabled', true);
  $('.captura').show();
  $('.data').show();

  data['E'] = 3900 * Math.sqrt(parseInt(E.val())) * 1000;
  data['unidadMedida'] = unidadMedida.val();
  data['Fy'] = parseInt(Fy.val());
}

/**
 * Agrega un nuevo elemento.
 * @param event Información del evento.
 */
function agregarElemento(event) {
  event.preventDefault();

  $('#btnAgregarElemento').prop('disabled', 'off');
  $('.elemento').show();

  $('#B').focus();
}

function guardarElemento(event) {
  event.preventDefault();

  let B = $('#B').val();
  let H = $('#H').val();

  if (isEmptyString(B) || isEmptyString(H)) {
    alertify.alert('La Base y la Altura son campos obligatorios.');
    return;
  }

  const tipo = $('#elemento').val();
  B = parseFloat(B);
  H = parseFloat(H);

  const id = data.elementos.filter(e => e.tipo === tipo).length + 1;
  const elemento = new Elemento(id, tipo, B, H);

  data.elementos.push(elemento);

  if (data.elementos.length === 1) {
    $('.hr-elementos').show();
    $('.row-elementos').show();
  }

  limpiarCamposElemento();
  $('#tipoElemento').append(`<option value="${tipo}${id}">${tipo === 'vg' ? 'Viga' : 'Columna'}-${id}</option>`)

  if (data.elementos.length === 1) {
    $('#btnAgregarNuevoMF').prop('disabled', false);
    $('.hr-mfs').show();
    $('.row-mfs').show();
  }

  alertify.success('Se ha creado un nuevo elemento.');
  $('.elemento').hide(1000);

  actualizarTablaElementos(elemento);
  $('#E').val(data['E']);
  $('#btnAgregarElemento').removeAttr('disabled');
}

/**
 * Limpia los campos del elemento.
 */
function limpiarCamposElemento() {
  $('#B').val('');
  $('#H').val('');
  $('#E').val('');
}

/**
 * Agrega un nuevo MF a la interfaz.
 * @param event Información del evento.
 */
function agregarMF(event) {
  event.preventDefault();

  const mf = $('#mf');
  mf.prop('disabled', true);
  $('#tipoElemento').prop('disabled', true);
  $(this).prop('disabled', true);
  $('#L').focus();
  $('.mf').show();

  if (existeCargaRepartidaParaMf(mf.val())) {
    $('#W').prop('disabled', true);
  }
}

/**
 * Guarda un MF en la memoria del navegador.
 * @param event Información del evento.
 */
function guardarMf(event) {
  event.preventDefault();

  $(this).prop('disabled', false);
  $('#btnGenerarTablaIteracion').removeAttr('disabled');
  let mfSeleccionado = $('#mf');
  const tipoElementoSeleccionado = $('#tipoElemento');
  let mf = mfSeleccionado.val();
  const tipoElemento = tipoElementoSeleccionado.val();

  let longitud = $('#L').val();
  let cargaRepartida = $('#W').val().trim() || null;

  if (isNaNOrNullOrUndefined(longitud)) {
    alertify.alert('La Longitud y la Carga repartida son campos obligatorios.');
    return;
  }

  longitud = parseFloat(longitud);
  if (cargaRepartida) {
    cargaRepartida = parseFloat(cargaRepartida);
  }

  let cargasPuntuales = [];

  let continuar = true;

  $('.carga-puntual').each((i) => {
    let valorCargaPuntual = $(`#P-${i}`).val();
    if (continuar && isNaNOrNullOrUndefined(valorCargaPuntual)) {
      alertify.alert('Todos los campos de Carga puntual son obligatorios.');
      continuar = false;
      return;
    }

    valorCargaPuntual = parseFloat(valorCargaPuntual);

    let longitudIzquierda = null;
    let longitudDerecha = null;
    if ($(`input[name="excentricaCentrica-${i}"]:checked`).val() === 'excentrica') {
      let a = $(`#a-${i}`).val();
      let b = $(`#b-${i}`).val();

      if (continuar && (isNaNOrNullOrUndefined(a) || isNaNOrNullOrUndefined(b))) {
        alertify.alert('Todos los campos de Longitud Izquierda y Longitud Derecha son obligatorios.');
        continuar = false;
        return;
      }

      longitudIzquierda = parseFloat(a);
      longitudDerecha = parseFloat(b);
    }

    cargasPuntuales.push(new CargaPuntual(valorCargaPuntual, longitudIzquierda, longitudDerecha));
  });

  if (!continuar) {
    return;
  }

  let nuevoMf = new MF(mf, tipoElemento, longitud, cargaRepartida);
  nuevoMf.cargasPuntuales = cargasPuntuales;
  nuevoMf.un = obtenerUn(tipoElemento);

  data.mfs.push(nuevoMf);

  actualizarTablaMfs();
  actualizarTablaCalculosElasticidad();

  $('.mf').hide();
  $('#btnAgregarNuevoMF').removeAttr('disabled');
  limpiarCamposMf();
  $('option:selected', '#mf').remove();
  mfSeleccionado.removeAttr('disabled');
  tipoElementoSeleccionado.removeAttr('disabled');

  alertify.success('Se ha creado un nuevo MF.');
}

/**
 * Limpia los campos de nuevo MF.
 */
function limpiarCamposMf() {
  $('#L').val('');
  $('#W').val('');
  $('#cargasPuntuales').empty();
}

/**
 * Actualiza la tabla de elementos según el último elemento agregado.
 * @param elemento Último elemento agregado.
 */
function actualizarTablaElementos(elemento) {
  const nuevoElementoTr = $('<tr>');

  nuevoElementoTr.append(`<td>${elemento.tipo === 'vg' ? 'Viga-' + elemento.id : 'Columna-' + elemento.id}</td>`);
  nuevoElementoTr.append(`<td>${elemento.B}</td>`);
  nuevoElementoTr.append(`<td>${elemento.H}</td>`);

  let I = (1 / 12) * elemento.B * Math.pow(elemento.H, 3);
  elemento.I = I;
  nuevoElementoTr.append(`<td>${I}</td>`);

  if (data.elementos.length === 1) {
    nuevoElementoTr.append(`<td>${1}</td>`);
    elemento.UN = 1;
  } else {
    const elementoPenultimo = _.nth(data.elementos, -2);
    const nuevoUN = I * elementoPenultimo.UN / elementoPenultimo.I;
    elemento.UN = nuevoUN;
    nuevoElementoTr.append(`<td>${nuevoUN}</td>`);
  }

  $('#tblElementos').append(nuevoElementoTr);
}

/**
 * Encuentra el mínimo común múltiple entre los valores de longitud.
 * @returns {*} Mínimo Común Múltiplo.
 */
function encontrarMCM() {
  let longitudes = _.values(_.mapValues(data.mfs, 'longitud'));

  return calcularMinimoComunMultiplo(longitudes);
}

/**
 * Actualiza la tabla de MFs a medida que se agrega nuevos MFs.
 */
function actualizarTablaMfs() {
  const mcm = encontrarMCM();

  let tblMfs = $('#tblMfs');
  $('#tblMfs > tbody').empty();

  data.mfs.forEach(e => {
    let sumaMfs = 0;
    e.mcm = mcm;

    if (!isNaNOrNullOrUndefined(e.cargaRepartida) && e.cargasPuntuales.length) {

      const [filaCartaRepartida, MfCargaRepartida] = generarFilaMfConCargaRepartida(e, mcm, e.signo);
      tblMfs.append(filaCartaRepartida);
      sumaMfs = MfCargaRepartida;

      e.cargasPuntuales.forEach(f => {
        const [filaCargaPuntual, MfCargaPuntual] = generarFilaCargaPuntual(e, f, e.mf, e.longitud, mcm, e.signo);
        tblMfs.append(filaCargaPuntual);
        sumaMfs += MfCargaPuntual;
      });

      const ultimaFila = generarFilaSumarizada(e, e.mf, e.longitud, mcm, sumaMfs);
      tblMfs.append(ultimaFila);
    } else if (!isNaNOrNullOrUndefined(e.cargaRepartida) && !e.cargasPuntuales.length) {
      const [fila, __] = generarFilaMfConCargaRepartida(e, mcm, e.signo);
      tblMfs.append(fila);
    } else if (isNaNOrNullOrUndefined(e.cargaRepartida) && e.cargasPuntuales.length) {
      let f = e.cargasPuntuales[0];
      const [filaCargaPuntual, __] = generarFilaCargaPuntual(e, f, e.mf, e.longitud, mcm, e.signo);
      tblMfs.append(filaCargaPuntual);
    } else if (isNaNOrNullOrUndefined(e.cargaRepartida) && !e.cargasPuntuales.length) {
      const ultimaFila = generarFilaSumarizada(e, e.mf, e.longitud, mcm, 0);
      tblMfs.append(ultimaFila);
    }
  });

  tblMfs.DataTable();
}

/**
 * Genera una nueva fila de MF con carga repartida.
 * @param mf MF a agregar.
 * @param mcm Mínimo común múltiplo.
 * @param signo Signo del elemento a agregar.
 * @returns {(*|jQuery|HTMLElement|number)[]} Retorna arreglo con la fila creada y el Mf calculado.
 */
function generarFilaMfConCargaRepartida(mf, mcm, signo) {
  let row = $('<tr>');
  row.append($(`<td>${mf.mf}</td>`));
  row.append($(`<td>${mf.cargaRepartida}</td>`));
  row.append('<td>');
  row.append(`<td>${mf.longitud}</td>`);
  row.append('<td>');
  row.append('<td>');

  let denominador = 12;

  if (mf.mf === 'A-B') {
    denominador = 30;
  } else if (mf.mf === 'B-A') {
    denominador = 20;
  }

  const Mf = signo * mf.cargaRepartida * Math.pow(mf.longitud, 2) / denominador;

  row.append(`<td>${establecerAlMenosNDecimales(Mf)}</td>`);

  agregarColumnasComputadasMfs(row, mcm, mf);

  return [row, Mf];
}

/**
 * Genera una fila con carga puntula.
 * @param mf MF a agregar.
 * @param cargaPuntual Carga puntual a agregar.
 * @param tipoMf Tipo de MF agregar.
 * @param longitud Longitud.
 * @param mcm Mínimo común múltiplo.
 * @param signo Signo del MF.
 * @returns {(*|jQuery|HTMLElement|number)[]} Retorna arreglo con la fila creada y el Mf calculado.
 */
function generarFilaCargaPuntual(mf, cargaPuntual, tipoMf, longitud, mcm, signo) {
  let row = $('<tr>');
  row.append($(`<td>${tipoMf}</td>`));
  row.append('<td>');
  row.append(`<td>${cargaPuntual['valor']}</td>`);
  row.append(`<td>${longitud}</td>`);
  row.append($(`<td>${!_.isNull(cargaPuntual.longitudIzquierda) && !_.isNaN(cargaPuntual.longitudIzquierda) ? cargaPuntual.longitudIzquierda : ''}</td>`));
  row.append($(`<td>${!_.isNull(cargaPuntual.longitudDerecha) && !_.isNaN(cargaPuntual.longitudDerecha) ? cargaPuntual.longitudDerecha : ''}</td>`));

  let Mf = signo * cargaPuntual.valor * longitud / 8;

  if (cargaPuntual.esExcentrica && signo > 0) {
    Mf = signo * cargaPuntual.valor * cargaPuntual.longitudIzquierda * Math.pow(cargaPuntual.longitudDerecha, 2) / Math.pow(longitud, 2);
  } else if (cargaPuntual.esExcentrica) {
    Mf = signo * cargaPuntual.valor * cargaPuntual.longitudDerecha * Math.pow(cargaPuntual.longitudIzquierda, 2) / Math.pow(longitud, 2);
  }

  row.append(`<td>${establecerAlMenosNDecimales(Mf)}</td>`);

  agregarColumnasComputadasMfs(row, mcm, mf);

  return [row, Mf];
}

/**
 * Genera una fila sumarizada.
 * @param mf MF con los datos a calcular.
 * @param tipoMf Tipo de MF.
 * @param longitud Longitud.
 * @param mcm Mínimo común múltiplo.
 * @param sumaMfs Suma de MFs anteriores.
 * @returns {*|jQuery|HTMLElement} Retorna arreglo con la fila creada y el Mf calculado.
 */
function generarFilaSumarizada(mf, tipoMf, longitud, mcm, sumaMfs) {
  let row = $('<tr>');
  row.append($(`<td>${tipoMf}</td>`));
  row.append('<td>');
  row.append('<td></td>');
  row.append(`<td>${longitud}</td>`);
  row.append('<td></td>');
  row.append('<td></td>');

  row.append(`<td>${establecerAlMenosNDecimales(sumaMfs)}</td>`);

  agregarColumnasComputadasMfs(row, mcm, mf);

  return row;
}

/**
 * Agregar columnas computadas de MFs.
 * @param row Fila sobre la que se agregarán celdas con los nuevos cálculos.
 * @param mcm Mínimo común múltiplo.
 * @param mf MF.
 */
function agregarColumnasComputadasMfs(row, mcm, mf) {
  mf.il = mf.un / mf.longitud;
  mf.k = mf.il * mcm;
  row.append(`<td>${mcm}</td>`);
  row.append(`<td>${establecerAlMenosNDecimales(mf.un)}</td>`);
  row.append(`<td>${establecerAlMenosNDecimales(mf.il)}</td>`);
  row.append(`<td>${establecerAlMenosNDecimales(mf.k)}</td>`);
}

/**
 * Comprueba si existe carga repartida para un nombre de MF dado.
 * @param nombreMf Nombre del MF.
 * @returns {value is boolean} true si existe, false en caso contrario.
 */
function existeCargaRepartidaParaMf(nombreMf) {
  return _.isBoolean(_.find(data.mfs, (mf) => mf.mf === nombreMf && !mf.cargaRepartida));
}

/**
 * Crea una nueva carga puntual.
 * @param event Información del evento de creación de carga puntual.
 */
function crearCargaPuntual(event) {
  event.preventDefault();
  let n = $('.carga-puntual').length;

  let template = (n > 0 ? '<hr>' : '') + `
  <div class="carga-puntual">
        <div class="form-group row mf">
          <label class="col-md-4 control-label">Carga puntual (P)</label>
          <div class="col-md-5">
            <label>
              <input name="P-${n}" id="P-${n}" type="number" placeholder="Carga puntual" class="form-control input-md"
                     required="">
            </label>

          </div>
        </div>

        <div class="form-group row mf">
          <label class="col-md-4 control-label"></label>
          <div class="col-md-4">
            <label class="radio-inline">
              <input type="radio" name="excentricaCentrica-${n}" value="excentrica" checked="checked">
              Excéntrica
            </label>
            <label class="radio-inline">
              <input type="radio" name="excentricaCentrica-${n}" value="centrica">
              Céntrica
            </label>
          </div>
        </div>

        <div class="form-group row mf centrica-${n}">
          <label class="col-md-4 control-label">Longitud izquierda (a)</label>
          <div class="col-md-5">
            <label>
              <input name="a-${n}" id="a-${n}" type="number" placeholder="Longitud izquierda" class="form-control input-md"
                     required="">
            </label>

          </div>
        </div>

        <div class="form-group row mf centrica-${n}">
          <label class="col-md-4 control-label">Longitud derecha (b)</label>
          <div class="col-md-5">
            <label>
              <input name="b-${n}" id="b-${n}" type="number" placeholder="Longitud derecha" class="form-control input-md"
                     required="">
            </label>
          </div>
        </div>
      </div>
  `;

  $('#cargasPuntuales').append(template);

  $(`input[type=radio][name=excentricaCentrica-${n}]`).on('change', function () {
    const centrica = $(`.centrica-${n}`);
    switch ($(this).val()) {
      case 'excentrica':
        centrica.show();
        break;
      case 'centrica':
        centrica.hide();
        break;
    }
  });

  $(`P-${n}`).focus();
}

/**
 * Genera las tablas de iteraciones.
 * @param event
 */
function generarTablasIteraciones(event) {
  event.preventDefault();

  sumatoriasMfs = {};
  const tablaIteracionesMfs = generarTablaIteracionesMfs('tblMfs');
  const divIteracionesMfs = $('#iteracionesMfs');
  divIteracionesMfs.empty().append(tablaIteracionesMfs);
  divIteracionesMfs.append('<br>');

  sumatoriasMfsModulosElasticidad = {};
  const tablaIteracionesMfsModuloElasticidad = generarTablaIteracionesMfs('tblMfsCalculosElasticidad');
  const divIteracionesMfsModuloElasticidad = $('#iteracionesMfsModuloElasticidad');
  const factorK = calcularFactorK();

  const [filaMomento, momentos] = generarFilaMomento(factorK);
  tablaIteracionesMfsModuloElasticidad.find('tbody').append(filaMomento);
  divIteracionesMfsModuloElasticidad.empty().append(tablaIteracionesMfsModuloElasticidad);

  const tabla = generarTablaVigas(momentos);

  const tablasCalculos = $('#tablasCalculos');
  tablasCalculos.append(tabla);
}

/**
 * Genera tabla de vigas.
 * @param momentos Momentos calculados.
 * @returns {*|jQuery|HTMLElement} Tabla con los datos de las vigas.
 */
function generarTablaVigas(momentos) {
  const tabla = $('<table>');
  tabla.addClass('table');
  tabla.addClass('table-striped');
  const tbody = $('<tbody>');

  let mfsVigas = _.filter(data.mfs, e => _.startsWith(e.tipoElemento, 'vg'));

  let gruposPorViga = _.groupBy(mfsVigas, 'tipoElemento');

  let primeraFila = $('<tr>');
  primeraFila.append('<td></td>');
  let segundaFila = $('<tr>');
  segundaFila.append(`<td></td>`);
  let terceraFila = $('<tr>');
  terceraFila.append(`<td class="centered-cell">W</td>`);
  let cuartaFila = $('<tr>');
  cuartaFila.append(`<td class="centered-cell">P</td>`);
  let quintaFila = $('<tr>');
  quintaFila.append(`<td class="centered-cell">Pe</td>`);
  let sextaFila = $('<tr>');
  sextaFila.append(`<td class="centered-cell">Pe</td>`);
  let septimaFila = $('<tr>');
  septimaFila.append(`<td class="centered-cell">Momento</td>`);
  let octavaFila = $('<tr>');
  octavaFila.append(`<td class="centered-cell">Reacción</td>`);

  for (const k of _.keys(gruposPorViga)) {
    const grupo = gruposPorViga[k];
    const mfsSinRepeticion = [...new Set(_.map(grupo, e => e.mf.split('-').sort().join('-')))]

    for (const e of mfsSinRepeticion) {
      const letras = e.split('-');
      primeraFila.append(`<td colspan="2" class="centered-cell">${k}</td>`);
      segundaFila.append(_.map(letras, f => `<td class="centered-cell">${f}</td>`).join(''));

      const mf1 = _.find(data.mfs, f => f.mf === e);
      const mf2 = _.find(data.mfs, f => f.mf === reverseString(e));

      if (mf1 && mf2) {
        let sumaPrimeraColumna = 0;
        let sumaSegundaColumna = 0;
        let resultado1 = 0;
        let resultado2 = 0;

        if (mf1.cargaRepartida && mf2.cargaRepartida) {
          resultado1 = mf1.cargaRepartida * mf1.longitud / 2;
          sumaPrimeraColumna += resultado1;
          terceraFila.append(`<td class="centered-cell">${resultado1}</td>`);

          resultado2 = mf2.cargaRepartida * mf2.longitud / 2;
          sumaSegundaColumna += resultado2;
          terceraFila.append(`<td class="centered-cell">${resultado2}</td>`);
        }

        if (mf1.cargasPuntuales.length) {
          if (mf1.cargasPuntuales[0].esExcentrica) {
            resultado1 = mf1.cargasPuntuales[0].valor / mf1.longitud * mf1.cargasPuntuales[0].longitudIzquierda
            sumaPrimeraColumna += resultado1;
            cuartaFila.append(`<td class="centered-cell">${resultado1}</td>`);
          } else {
            resultado1 = mf1.cargasPuntuales[0].valor / 2;
            sumaPrimeraColumna += resultado1;
            cuartaFila.append(`<td class="centered-cell">${resultado1}</td>`);
          }

          if (mf1.cargasPuntuales[0].esExcentrica) {
            resultado1 = mf1.cargasPuntuales[0].valor / mf1.longitud * mf1.cargasPuntuales[0].longitudDerecha;
            sumaPrimeraColumna += resultado1;
            quintaFila.append(`<td class="centered-cell">${resultado1}</td>`);

            resultado1 = mf1.cargasPuntuales[0].valor / mf1.longitud * mf1.cargasPuntuales[0].longitudDerecha;
            sumaPrimeraColumna += resultado1;
            sextaFila.append(`<td class="centered-cell">${resultado1}</td>`);
          } else {
            quintaFila.append(`<td class="centered-cell">0</td>`);
          }
        } else {
          cuartaFila.append(`<td class="centered-cell">0</td>`);
          quintaFila.append(`<td class="centered-cell">0</td>`);
          sextaFila.append(`<td class="centered-cell">0</td>`);
        }

        if (mf2.cargasPuntuales.length) {
          if (mf1.cargasPuntuales[0].esExcentrica) {
            resultado2 = mf2.cargasPuntuales[0].valor / mf2.longitud * mf2.cargasPuntuales[0].longitudDerecha;
            sumaSegundaColumna += resultado2;

            cuartaFila.append(`<td class="centered-cell">${resultado2}</td>`);
          } else {
            resultado2 = mf2.cargasPuntuales[0].valor / 2;
            sumaSegundaColumna += resultado2;

            cuartaFila.append(`<td class="centered-cell">${resultado2}</td>`);
          }

          if (mf2.cargasPuntuales[0].esExcentrica) {
            resultado2 = mf2.cargasPuntuales[0].valor * mf2.longitud * mf2.cargasPuntuales[0].longitudDerecha;
            sumaSegundaColumna += resultado2;
            quintaFila.append(`<td class="centered-cell">${resultado2}</td>`);

            resultado2 = mf1.cargasPuntuales[0].valor / mf1.longitud * mf1.cargasPuntuales[0].longitudDerecha;
            sumaSegundaColumna += resultado2;
            sextaFila.append(`<td class="centered-cell">${resultado2}</td>`);
          } else {
            quintaFila.append(`<td class="centered-cell">0</td>`);
          }
        } else {
          cuartaFila.append(`<td class="centered-cell">0</td>`);
          quintaFila.append(`<td class="centered-cell">0</td>`);
          sextaFila.append(`<td class="centered-cell">0</td>`);
        }

        const momento1 = momentos[e];
        const momento2 = momentos[reverseString(e)];

        resultado1 = (momento1 + momento2) / mf1.longitud;
        sumaPrimeraColumna += resultado1;

        resultado2 = -resultado1;
        sumaSegundaColumna += resultado2;

        septimaFila.append(`<td>${resultado1}</td>`);
        septimaFila.append(`<td>${resultado2}</td>`);

        octavaFila.append(`<td>${sumaPrimeraColumna}</td>`);
        octavaFila.append(`<td>${sumaSegundaColumna}</td>`);
      }
    }
  }

  tbody.append(primeraFila);
  tbody.append(segundaFila);
  tbody.append(terceraFila);
  tbody.append(cuartaFila);
  tbody.append(quintaFila);
  tbody.append(sextaFila);
  tbody.append(septimaFila);
  tbody.append(octavaFila);


  tabla.append(tbody);

  return tabla;
}

/**
 * Calcula el factor K.
 * @returns {number} El factor K.
 */
function calcularFactorK() {
  const mfsColumnas = _.filter(data.mfs, e => _.startsWith(e.tipoElemento, 'col'));

  const agregados = [];
  let factorK = 0;

  for (const mf of mfsColumnas) {
    if (agregados.indexOf(mf.mf) === -1) {
      const invertido = reverseString(mf.mf);

      if (agregados.indexOf(invertido) !== -1) {
        continue;
      }

      if (mf.cargaRepartida && mf.longitud) {
        factorK += mf.cargaRepartida * mf.longitud;
        if (mf.cargasPuntuales.length) {
          for (const cp of mf.cargasPuntuales) {
            if (cp.valor) {
              factorK += cp.valor;
            }
          }
        }
      } else if (mf.cargasPuntuales.length) {
        for (const cp of mf.cargasPuntuales) {
          if (cp.valor) {
            factorK += cp.valor;
          }
        }
      }

      agregados.push(mf.mf);
    }
  }

  const mitad = factorK / 2;
  const L = _.find(mfsColumnas, e => e.longitud).longitud;
  factorK = mitad * L;
  const sumaMfs = calcularSumatorias('tblMfs');
  const sumaMfsFactorElasticidad = calcularSumatorias('tblMfsCalculosElasticidad');
  return (factorK - sumaMfs) / sumaMfsFactorElasticidad;
}

/**
 * Calcula el factor de elasticidad.
 * @param factorK El factor K.
 * @returns {(*|jQuery|HTMLElement|{})[]} El factor de elasticidad con la fila.
 */
function generarFilaMomento(factorK) {
  const mfs = data.mfs.map(e => e.mf).sort();
  const row = $('<tr>');

  const momentos = {};

  const tds = _.map(mfs, e => {
    momentos[e] = sumatoriasMfs[e] + (sumatoriasMfsModulosElasticidad[e] * factorK);
    return `<td style="text-align: center;">${momentos[e]}</td>`;
  }).join('');

  row.append(`<td style="text-align: center; background-color: red">MOMENTO</td>`);
  row.append(tds);
  return [row, momentos];
}

/**
 * Calcula el momento de inercia.
 * @param tablaId El id de la tabla.
 * @returns {*|jQuery|HTMLElement} Tabla con el momento de inercia.
 */
function generarTablaIteracionesMfs(tablaId) {
  let encabezado = '<td></td>' + generarEncabezado();
  let subEncabezado = '<td></td>' + generarSubencabezado();

  const tablaMfs = crearTablaMfs(tablaId);

  const [filaK, valoresK] = crearFilaK(tablaMfs);
  const [filaFD, valoresFilaFD] = crearFilaFD(valoresK);

  const [htmlEncabezado, valoresEncabezado] = crearEncabezadoPrimeraIteracion(tablaId, tablaMfs);
  let [htmlFila, valoresFila] = crearFilaPrimeraIteracion(tablaId, valoresEncabezado, valoresFilaFD);

  let iteraciones = generarIteraciones(tablaId, valoresFilaFD, valoresEncabezado, valoresFila);

  let table = $('<table>');
  table.addClass('table table-striped table-bordered')
  let tableBody = $('<tbody>');
  const tableHeader = $('<thead>');
  tableHeader.append(`<tr class="iteracion1EncabezadoPrincipal">${encabezado}</tr>`);
  tableHeader.append(`<tr class="iteracion1SubencabezadoPrincipal">${subEncabezado}</tr>`);
  tableHeader.append(`<tr class="iteracion1FilaK"><td>K</td>${filaK}</tr>`);
  tableHeader.append(`<tr class="iteracion1FilaFd"><td>F.D</td>${filaFD}</tr>`);

  tableBody.append(`<tr class="iteracion1Iteracion1Encabezado"><td rowspan="2">Iteración 1</td>>${htmlEncabezado}`);
  tableBody.append(`<tr class="iteracion1Iteracion1Fila">${htmlFila}</tr>`);

  for (let i = 0; i < iteraciones.length; i++) {
    const iteracion = iteraciones[i];
    tableBody.append(`<tr class="iteracion1Iteracion${i + 2}Encabezado"><td rowspan="2">Iteración ${i + 2}</td>>${iteracion.htmlEncabezado}`);
    tableBody.append(`<tr class="iteracion1Iteracion${i + 2}Fila">${iteracion.htmlFila}</tr>`);
  }

  iteraciones.splice(0, 0, {
    htmlEncabezado: htmlEncabezado,
    valoresEncabezado: valoresEncabezado, htmlFila: htmlFila,
    valoresFila: valoresFila
  });

  tableBody.append(`<tr><td></td>${agregarSumatorias(tablaId)}</tr>`);

  table.append(tableHeader);
  table.append(tableBody);

  return table;
}

/**
 * Calcula las sumatorias de las MFs a partir del ID de una tabla.
 * @param tablaId El ID de la tabla.
 * @returns {number} El valor de las sumatorias.
 */
function calcularSumatorias(tablaId) {
  const mfsColumnas = _.filter(data.mfs, e => _.startsWith(e.tipoElemento, 'col'));

  if (tablaId === 'tblMfs') {
    return _.sum(_.map(mfsColumnas, e => sumatoriasMfs[e.mf]));
  } else {
    return _.sum(_.map(mfsColumnas, e => sumatoriasMfsModulosElasticidad[e.mf]));
  }
}

/**
 * Calcula las sumatorias de las MFs a partir del ID de una tabla.
 * @param tablaId El ID de la tabla.
 * @returns {string} El valor de las sumatorias.
 */
function agregarSumatorias(tablaId) {
  const mfs = data.mfs.map(e => e.mf).sort();

  if (tablaId === 'tblMfs') {
    return _.map(mfs, e => `<td style="text-align: center; background-color: azure">${sumatoriasMfs[e]}</td>`).join('');
  } else {
    return _.map(mfs, e => `<td style="text-align: center; background-color: azure">${sumatoriasMfsModulosElasticidad[e]}</td>`).join('');
  }
}

/**
 * Genera las iteraciones de la tabla.
 * @param tablaId El ID de la tabla.
 * @param valoresFilaFD Los valores de la fila F.D.
 * @param filaValoresPrimeraIteracion Los valores de la fila de la primera iteración.
 * @param valoresPrimeraIteracion Valores de la primera iteración.
 * @returns {*[]} Las iteraciones.
 */
function generarIteraciones(tablaId, valoresFilaFD, filaValoresPrimeraIteracion, valoresPrimeraIteracion) {
  let iteraciones = [];
  let continuar = true;
  let htmlFila;
  let htmlEncabezado;

  do {
    let valoresEncabezado = null;
    let valoresFila = null;

    if (continuar) {
      [htmlEncabezado, valoresEncabezado] = generarEncabezadoIteracion(tablaId, valoresPrimeraIteracion);
      [htmlFila, valoresFila] = generarFilaIteracion(tablaId, valoresFilaFD, valoresEncabezado);
      iteraciones.push({htmlEncabezado, valoresEncabezado, htmlFila, valoresFila});

      continuar = false;
    } else {
      const ultimaIteracion = _.last(iteraciones);
      valoresPrimeraIteracion = ultimaIteracion.valoresFila;

      [htmlEncabezado, valoresEncabezado] = generarEncabezadoIteracion(tablaId, valoresPrimeraIteracion);
      [htmlFila, valoresFila] = generarFilaIteracion(tablaId, valoresFilaFD, valoresEncabezado);
      iteraciones.push({htmlEncabezado, valoresEncabezado, htmlFila, valoresFila});
    }

  } while (esSumaAproximadaACero(_.last(iteraciones).valoresFila));

  return iteraciones;
}

/**
 * Comprueba si la suma de una fila es aproximada a cero.
 * @param valoresFila Los valores de la fila.
 * @returns {boolean} Si la suma es aproximada a cero.
 */
function esSumaAproximadaACero(valoresFila) {
  let valores = _.map(valoresFila, e => Math.abs(_.toNumber(establecerAlMenosNDecimales(e.v))) >= 0.001);
  valores = _.filter(valores, e => e);

  return valores.length > 1;
}

/**
 * Genera la fila de iteración.
 * @param tablaId El ID de la tabla.
 * @param valoresFilaFD Los valores de la fila F.D.
 * @param encabezado  El encabezado de la iteración.
 * @returns {(string|*[])[]} Fila HTML y valores calculados.
 */
function generarFilaIteracion(tablaId, valoresFilaFD, encabezado) {
  const letras = [...new Set(data.mfs.map(e => _.head(e.mf)).sort())];
  const grupos = _.groupBy(data.mfs, mf => mf.mf[0]);

  const valores = [];

  const resultado = _.map(letras, l => {
    return _.map(_.sortBy(grupos[l], f => f.mf), e => {
      const mfs = _.filter(encabezado, o => _.startsWith(o['mf'], l));
      const fd = _.find(valoresFilaFD[l], v => v.mf === e.mf);
      const datos = _.map(mfs, d => d['v']);
      const resultado = -_.sum(datos) * fd.fd;
      valores.push({mf: e.mf, v: resultado});

      incrementarSumatoriaMf(tablaId, e.mf, resultado);

      return `<td style="text-align: center;">${establecerAlMenosNDecimales(resultado)}</td>`;
    }).join('');
  }).join('');

  return [resultado, valores];
}

/**
 * Genera el encabezado de la iteración.
 * @param tablaId El ID de la tabla.
 * @param valoresPrimeraIteracion Los valores de la primera iteración.
 * @returns {(string|*[])[]} Encabezado HTML y valores calculados.
 */
function generarEncabezadoIteracion(tablaId, valoresPrimeraIteracion) {
  const letras = [...new Set(data.mfs.map(e => _.head(e.mf)).sort())];
  const grupos = _.groupBy(data.mfs, mf => mf.mf[0]);

  const valores = [];

  const resultado = _.map(letras, l => {
    return _.map(_.sortBy(grupos[l], f => f.mf), e => {
      const valor = _.find(valoresPrimeraIteracion, v => reverseString(v.mf) === e.mf);

      valores.push({mf: e.mf, v: valor.v / 2});

      incrementarSumatoriaMf(tablaId, e.mf, valor.v / 2);

      return `<td style="text-align: center;">${establecerAlMenosNDecimales(valor.v / 2)}</td>`;
    }).join('');
  }).join('');

  return [resultado, valores]
}

/**
 * Crea la primera fila de la tabla.
 * @param tablaId El ID de la tabla.
 * @param filaValoresPrimeraIteracion Los valores de la fila de la primera iteración.
 * @param valoresFilaFD Los valores de la fila F.D.
 * @returns {(string|*[])[]} Fila HTML y valores calculados.
 */
function crearFilaPrimeraIteracion(tablaId, filaValoresPrimeraIteracion, valoresFilaFD) {
  const letras = [...new Set(data.mfs.map(e => _.head(e.mf)).sort())];

  const ultimaIteracion = [];

  const resultadoHtml = _.map(letras, l => {
    const valores = _.map(filaValoresPrimeraIteracion[l], e => e.v);
    const suma = _.sum(valores);

    return _.map(valoresFilaFD[l], e => {
      const resultado = -suma * e.fd;
      ultimaIteracion.push({mf: e.mf, v: resultado});

      incrementarSumatoriaMf(tablaId, e.mf, resultado);

      return `<td style="text-align: center;">${establecerAlMenosNDecimales(resultado)}</td>`;
    }).join('');
  }).join('');

  return [resultadoHtml, ultimaIteracion];
}

/**
 * Incrementa la sumatoria de un MF.
 * @param tablaId El ID de la tabla.
 * @param mf El MF.
 * @param valor El valor calculado que se debe sumar.
 */
function incrementarSumatoriaMf(tablaId, mf, valor) {
  if (tablaId === 'tblMfs') {

    if (sumatoriasMfs[mf]) {
      sumatoriasMfs[mf] += valor;
    } else {
      sumatoriasMfs[mf] = valor;
    }
  } else {
    if (sumatoriasMfsModulosElasticidad[mf]) {
      sumatoriasMfsModulosElasticidad[mf] += valor;
    } else {
      sumatoriasMfsModulosElasticidad[mf] = valor;
    }
  }
}

/**
 * Crea el encabezado de la tabla.
 * @param tablaId El ID de la tabla.
 * @param tablaMfs Tabla de los MFs.
 * @returns {(string|{})[]} Encabezado HTML y valores calculados.
 */
function crearEncabezadoPrimeraIteracion(tablaId, tablaMfs) {
  const letras = [...new Set(data.mfs.map(e => _.head(e.mf)).sort())];
  const grupos = _.groupBy(data.mfs, mf => mf.mf[0]);

  let valoresIteracion = {};

  const filaIteracion = _.map(letras, l => {
    valoresIteracion[l] = [];
    return _.map(_.sortBy(grupos[l], f => f.mf), e => {

      const mf = _.findLast(tablaMfs, g => g['MF'] === e.mf);

      incrementarSumatoriaMf(tablaId, e.mf, mf['Mf']);

      valoresIteracion[l].push({mf: e.mf, v: mf['Mf']});

      return `<td style="text-align: center;">${establecerAlMenosNDecimales(mf['Mf'])}</td>`;
    }).join('');
  }).join('');

  return [filaIteracion, valoresIteracion];
}

/**
 * Crea la fila FD.
 * @param valoresK Los valores de la fila K.
 * @returns {(string|{})[]} Fila HTML y valores calculados.
 */
function crearFilaFD(valoresK) {
  const valoresFilaFD = {};

  const filaFD = _.map(_.keys(valoresK), k => {
    valoresFilaFD[k] = [];
    const data = _.map(valoresK[k], e => e.K);
    const suma = _.sum(data)

    if (data.length === 1) {
      valoresFilaFD[k].push({mf: valoresK[k][0].mf, fd: 0});

      return '<th>0.000</th>';
    }

    return _.map(valoresK[k], e => {
      const resultado = e.K / suma;
      valoresFilaFD[k].push({mf: e.mf, fd: resultado});
      return `<th>${establecerAlMenosNDecimales(resultado)}</th>`;
    }).join('');
  }).join('');

  return [filaFD, valoresFilaFD];
}

/**
 * Crea la fila K.
 * @param tablaMfs Tabla de los MFs.
 * @returns {(string|*[])[]} Fila K HTML y valores calculados.
 */
function crearFilaK(tablaMfs) {
  const letras = [...new Set(data.mfs.map(e => _.head(e.mf)).sort())];
  const grupos = _.groupBy(data.mfs, mf => mf.mf[0]);

  let valoresK = [];

  const filaK = _.map(letras, l => {
    valoresK[l] = [];
    return _.map(_.sortBy(grupos[l], f => f.mf), e => {

      const mf = _.findLast(tablaMfs, g => g['MF'] === e.mf);

      valoresK[l].push({mf: e.mf, K: mf['K']});

      return `<th style="text-align: center;">${mf['K']}</th>`;
    }).join('');
  }).join('');

  return [filaK, valoresK];
}

/**
 * Crea la tabla de MFs.
 * @param tablaId El ID de la tabla.
 * @returns {Array<Object>} Tabla HTML y valores calculados.
 */
function crearTablaMfs(tablaId) {
  const tablaMfs = parseTable(document.querySelector(`#${tablaId}`));

  tablaMfs.forEach(e => {
    _.each(_.keys(e), k => {
      if (k !== 'MF') {
        e[k] = _.toNumber(e[k]);
      }
    });
  });

  return tablaMfs;
}

/**
 * Genera el encabezado de la tabla.
 * @returns {string} Encabezado HTML.
 */
function generarEncabezado() {
  let letras = [...new Set(data.mfs.map(e => _.head(e.mf)).sort())];

  return letras.map(e => {

    const contador = data.mfs.filter(d => _.head(d.mf) === e).length;
    return `<th colspan="${contador}" style="text-align: center;">${e}</th>`;
  }).join('');
}

function generarSubencabezado() {
  const letras = [...new Set(data.mfs.map(e => _.head(e.mf)).sort())];
  const grupos = _.groupBy(data.mfs, mf => mf.mf[0]);

  return _.map(letras, l => {
    return _.map(_.sortBy(grupos[l], f => f.mf), e => {
      return `<th style="text-align: center;">${e.mf}</th>`;
    }).join('');
  }).join('');
}

/**
 * Actualiza la tabla de cálculos elasticidad.
 */
function actualizarTablaCalculosElasticidad() {
  const tblMfsCalculosElasticidad = $('#tblMfsCalculosElasticidad');
  $(tblMfsCalculosElasticidad).find('tbody').empty();

  const mcm = encontrarMCM();
  for (const mf of data.mfs) {
    const row = $('<tr>');

    row.append(`<td>${mf.mf}</td>`);
    row.append(`<td>${data.E}</td>`);

    let I = '';
    const tipoElemento = mf.tipoElemento;
    const elemento = _.find(data.elementos, e => `${e.tipo}${e.id}` === tipoElemento);

    if (elemento.tipo === 'col') {
      I = elemento.I;
    }

    row.append(`<td>${I}</td>`);
    row.append(`<td>${mf.longitud}</td>`);
    row.append(`<td></td>`);
    row.append(`<td></td>`);

    let mfResultado = '';

    if (I) {
      mfResultado = 6 * data.E * I / (Math.pow(mf.longitud, 2)) / 1000;
      row.append(`<td>${establecerAlMenosNDecimales(mfResultado)}</td>`);
    } else {
      row.append(`<td></td>`);
    }

    agregarColumnasComputadasMfs(row, mcm, mf);

    tblMfsCalculosElasticidad.append(row);
  }

  tblMfsCalculosElasticidad.DataTable();
}

/**
 * Obtiene el UN a partir del tipo de elemento.
 * @param tipoElemento Tipo de elemento.
 * @returns {*} UN.
 */
function obtenerUn(tipoElemento) {
  return _.find(data.elementos, e => `${e.tipo}${e.id}` === tipoElemento)['UN'];
}
