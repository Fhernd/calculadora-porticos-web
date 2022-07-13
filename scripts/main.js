let data = {};
let tblMfs = null;

$(() => {
  init();
  $('#frmInicioCapturaDatos').on('submit', iniciarCapturaDatos);
  $('#btnAgregarElemento').on('click', agregarElemento);
  $('#btnGuardarElemento').on('click', guardarElemento);
  $('#btnAgregarNuevoMF').on('click', agregarMF);
  $('#btnCrearCargaPuntual').on('click', crearCargaPuntual)
  $('#btnGuardarMf').on('click', guardarMf);
  $('#btnGenerarTablaIteracion').on('click', generarTablaIteracion);

  $('#E').focus();
});

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
  $('#tblCalculosElasticidad').DataTable({
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

function iniciarCapturaDatos(event) {
  event.preventDefault();

  $('#btnIniciarCaptura').hide();
  const E = $('#E');
  const unidadMedida = $('input[name="unidadMedida"]');

  E.prop('disabled', true);
  unidadMedida.prop('disabled', true);
  $('.captura').show();
  $('.data').show();

  data['E'] = parseInt(E.val());
  data['unidadMedida'] = unidadMedida.val();
}

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

function limpiarCamposElemento() {
  $('#B').val('');
  $('#H').val('');
  $('#E').val('');
}

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

function guardarMf(event) {
  event.preventDefault();

  $(this).prop('disabled', false);
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

function limpiarCamposMf() {
  $('#L').val('');
  $('#W').val('');
  $('#cargasPuntuales').empty();
}

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

function encontrarMCM() {
  let longitudes = _.values(_.mapValues(data.mfs, 'longitud'));

  return calcularMinimoComunMultiplo(longitudes);
}

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

function agregarColumnasComputadasMfs(row, mcm, mf) {
  mf.il = mf.un / mf.longitud;
  mf.k = mf.il * mcm;
  row.append(`<td>${mcm}</td>`);
  row.append(`<td>${establecerAlMenosNDecimales(mf.un)}</td>`);
  row.append(`<td>${establecerAlMenosNDecimales(mf.il)}</td>`);
  row.append(`<td>${establecerAlMenosNDecimales(mf.k)}</td>`);
}

function existeCargaRepartidaParaMf(nombreMf) {
  return _.isBoolean(_.find(data.mfs, (mf) => mf.mf === nombreMf && !mf.cargaRepartida));
}

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

function generarTablaIteracion(event) {
  event.preventDefault();

  let encabezado = '<td></td>' + generarEncabezado();
  let subEncabezado = '<td></td>' + generarSubencabezado();

  const tablaMfs = crearTablaMfs();

  const [filaK, valoresK] = crearFilaK(tablaMfs);
  const [filaFD, valoresFilaFD] = crearFilaFD(valoresK);
  console.log(valoresFilaFD);

  let iteraciones = _.range(1, 16).map((i) => {
    const fila1Iteracion = _.range(data.mfs.length).map(() => `<td>${_.round(_.random(0, 13, true))}</td>`).join('')
    const fila2Iteracion = _.range(data.mfs.length).map(() => `<td>${_.round(_.random(0, 13, true))}</td>`).join('')

    return `<tr><td rowspan="2"> Iteración ${i}</td>${fila1Iteracion}</tr><tr>${fila2Iteracion}</tr>`;
  }).join('');

  let table = $('<table>');
  table.addClass('table table-striped table-bordered')
  let tableBody = $('<tbody>');
  tableBody.append(`<tr>${encabezado}</tr>`);
  tableBody.append(`<tr>${subEncabezado}</tr>`);
  tableBody.append(`<tr><td></td>${filaK}</tr>`);
  tableBody.append(`<tr><td>F.D</td>${filaFD}</tr>`);
  tableBody.append(iteraciones);

  table.append(tableBody);
  const divResultado = $('#resultado');
  divResultado.empty();
  divResultado.append(table);
}

function crearFilaFD(valoresK) {
  const valoresFilaFD = {};

  const filaFD = _.map(_.keys(valoresK), k => {
    valoresFilaFD[k] = [];
    const data = valoresK[k];
    const suma = _.sum(data)

    if (data.length === 1) {
      valoresFilaFD[k].push(0);

      return '<td>0.000</td>';
    }

    return _.map(data, d => {
      const resultado = d / suma;
      valoresFilaFD[k].push(resultado);
      return `<td>${establecerAlMenosNDecimales(resultado)}</td>`;
    }).join('');
  }).join('');

  return [filaFD, valoresFilaFD];
}

function crearFilaK(tablaMfs) {
  const letras = [...new Set(data.mfs.map(e => _.head(e.mf)).sort())];
  const grupos = _.groupBy(data.mfs, mf => mf.mf[0]);

  let valoresK = {};

  const filaK = _.map(letras, l => {
    valoresK[l] = [];
    return _.map(_.sortBy(grupos[l], f => f.mf), e => {
      const mf = _.findLast(tablaMfs, g => g['MF'] === e.mf);
      valoresK[l].push(mf['K']);
      return `<td style="text-align: center;">${mf['K']}</td>`;
    }).join('');
  }).join('');

  return [filaK, valoresK];
}

function crearTablaMfs() {
  const tablaMfs = parseTable(document.querySelector('#tblMfs'));

  tablaMfs.forEach(e => {
    _.each(_.keys(e), k => {
      if (k !== 'MF') {
        e[k] = _.toNumber(e[k]);
      }
    });
  });

  return tablaMfs;
}

function generarEncabezado() {
  let letras = [...new Set(data.mfs.map(e => _.head(e.mf)).sort())];

  return letras.map(e => {

    const contador = data.mfs.filter(d => _.head(d.mf) === e).length;
    return `<td colspan="${contador}" style="text-align: center;">${e}</td>`;
  }).join('');
}

function generarSubencabezado() {
  const letras = [...new Set(data.mfs.map(e => _.head(e.mf)).sort())];
  const grupos = _.groupBy(data.mfs, mf => mf.mf[0]);

  return _.map(letras, l => {
    return _.map(_.sortBy(grupos[l], f => f.mf), e => {
      return `<td style="text-align: center;">${e.mf}</td>`;
    }).join('');
  }).join('');
}

function actualizarTablaCalculosElasticidad() {
  const tblCalculosElasticidad = $('#tblCalculosElasticidad');
  $(tblCalculosElasticidad).find('tbody').empty();

  const mcm = encontrarMCM();
  console.log('123');
  for (const mf of data.mfs) {
    console.log(mf);
    const row = $('<tr>');

    row.append(`<td>${mf.mf}</td>`);
    row.append(`<td>${data.E}</td>`);

    const I = '';

    row.append(`<td>${I}</td>`);
    row.append(`<td>${mf.longitud}</td>`);
    row.append(`<td></td>`);
    row.append(`<td></td>`);

    let mfResultado = '';

    if (I) {
      mfResultado = '';
    }
    row.append(`<td>${mfResultado}</td>`);

    row.append(`<td>${mcm}</td>`);
    row.append(`<td>${1}</td>`);
    row.append(`<td>${1}</td>`);
    row.append(`<td>${1}</td>`);

    tblCalculosElasticidad.append(row);
  }
}

function obtenerUn(tipoElemento) {
  return _.find(data.elementos, e => `${e.tipo}${e.id}` === tipoElemento)['UN'];
}

