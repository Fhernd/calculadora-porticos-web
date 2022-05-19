let data = {};

$(() => {
  init();
  $('#frmInicioCapturaDatos').on('submit', iniciarCapturaDatos);
  $('#btnAgregarElemento').on('click', agregarElemento);
  $('#btnGuardarElemento').on('click', guardarElemento);
  $('#btnAgregarNuevoMF').on('click', agregarMF);
  $('#btnCrearCargaPuntual').on('click', crearCargaPuntual)
  $('#btnGuardarMf').on('click', guardarMf);
  $('#btnGenerarTablaIteracion').on('click', generarTablaIteracion)

  $('input[type=radio][name=excentricaCentrica]').on('change', function () {
    const centrica = $('.centrica');
    switch ($(this).val()) {
      case 'excentrica':
        centrica.show();
        break;
      case 'centrica':
        centrica.hide();
        break;
    }
  });

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
  $('#tblMfs').DataTable({
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

  let tipo = $('#elemento').val();
  let B = parseFloat($('#B').val());
  let H = parseFloat($('#H').val());

  let id = data.elementos.filter(e => e.tipo === tipo).length + 1;
  let elemento = new Elemento(id, tipo, B, H);

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
}

function limpiarCamposElemento() {
  $('#B').val('');
  $('#H').val('');
  $('#E').val('');
}

function agregarMF(event) {
  event.preventDefault();

  $('#mf').prop('disabled', true);
  $('#tipoElemento').prop('disabled', true);
  $(this).prop('disabled', true);
  $('#L').focus();
  $('.mf').show();

  if (existeCargaRepartidaParaMf($('#mf').val())) {
    $('#W').prop('disabled', true);
  }
}

function guardarMf(event) {
  event.preventDefault();

  $(this).prop('disabled', false);
  let mfSeleccionado = $('#mf');
  let tipoElementoSeleccionado = $('#tipoElemento');
  let mf = mfSeleccionado.val();
  let tipoElemento = tipoElementoSeleccionado.val();
  let longitud = parseFloat($('#L').val());
  let cargaRepartida = parseFloat($('#W').val());

  let cargasPuntuales = [];
  $('.carga-puntual').each((i) => {
    let valorCargaPuntual = parseFloat($(`input[name="P-${i}"]`).val());

    let longitudIzquierda = null;
    let longitudDerecha = null;
    if ($(`input[name="excentricaCentrica-${i}"]:checked`).val() === 'excentrica') {
      longitudIzquierda = parseFloat($('#a').val());
      longitudDerecha = parseFloat($('#b').val());
    }

    cargasPuntuales.push(new CargaPuntual(valorCargaPuntual, longitudIzquierda, longitudDerecha));
  });

  console.log(cargasPuntuales);

  let nuevoMf = new MF(mf, tipoElemento, longitud, cargaRepartida);
  nuevoMf.cargasPuntuales = cargasPuntuales;

  data.mfs.push(nuevoMf);

  actualizarTablaMfs();

  $('.mf').hide();
  $('#btnAgregarNuevoMF').removeAttr('disabled');
  limpiarCamposMf();
  $('option:selected', '#mf').remove();
  mfSeleccionado.removeAttr('disabled');
  tipoElementoSeleccionado.removeAttr('disabled');
}

function limpiarCamposMf() {
  $('#L').val('');
  $('#W').val('');
  $('#cargasPuntuales').empty();
}

function actualizarTablaElementos(elemento) {
  let nuevoElementoTr = $('<tr>');
  nuevoElementoTr.append(`<td>${elemento.tipo === 'vg' ? 'Viga-' + elemento.id : 'Columna-' + elemento.id}</td>`);
  nuevoElementoTr.append(`<td>${elemento.B}</td>`);
  nuevoElementoTr.append(`<td>${elemento.H}</td>`);
  let I = (1 / 2) * elemento.B * Math.pow(elemento.H, 2);
  nuevoElementoTr.append(`<td>${I}</td>`);
  elemento.I = I;

  if (data.elementos.length === 1) {
    nuevoElementoTr.append(`<td>${1}</td>`);
    elemento.UN = 1;
  } else {
    let elementoPenultimo = _.nth(data.elementos, -2);
    let nuevoUN = I * elementoPenultimo.UN / elementoPenultimo.I;
    elemento.UN = nuevoUN;
    nuevoElementoTr.append(`<td>${nuevoUN}</td>`);
  }

  $('#tblElementos').append(nuevoElementoTr);
}

function encontrarMCM() {
  let longitudes = _.values(_.mapValues(data.mfs, 'longitud'));

  console.log(longitudes);

  return calcularMinimoComunMultiplo(longitudes);
}

function actualizarTablaMfs() {
  let mcm = encontrarMCM();

  let tblMfs = $('#tblMfs');
  $('#tblMfs > tbody').empty();

  data.mfs.forEach(v => {
    let sumaMfs = 0;

    if ((!_.isNull(v.mf) && !_.isNaN(v.mf)) && v.cargasPuntuales.length) {
      const [filaCartaRepartida, MfCargaRepartida] = generarFilaMfConCargaRepartida(v, mcm);
      tblMfs.append(filaCartaRepartida);
      sumaMfs = MfCargaRepartida;

      v.cargasPuntuales.forEach(e => {
        const [filaCargaPuntual, MfCargaPuntual] = generarFilaCargaPuntual(e, v.mf, v.longitud, mcm);
        tblMfs.append(filaCargaPuntual);
        sumaMfs += MfCargaPuntual;
      });

      const ultimaFila = generarFilaSumarizada(v.mf, v.longitud, mcm, sumaMfs);
      tblMfs.append(ultimaFila);
    } else if ((!_.isNull(v.mf) && !_.isNaN(v.mf)) && !v.cargasPuntuales.length) {
      const [fila, __] = generarFilaMfConCargaRepartida(v, mcm);
      tblMfs.append(fila);
    } else if (v.cargasPuntuales.length) {
      let e = v.cargasPuntuales[0];
      const [filaCargaPuntual, __] = generarFilaCargaPuntual(e, v.mf, v.longitud, mcm);
      tblMfs.append(filaCargaPuntual);
    }
  });

  tblMfs.DataTable();
}

function generarFilaMfConCargaRepartida(mf, mcm) {
  let row = $('<tr>');
  row.append($(`<td>${mf.mf}</td>`));
  row.append($(`<td>${mf.cargaRepartida}</td>`));
  row.append('<td>');
  row.append(`<td>${mf.longitud}</td>`);
  row.append('<td>');
  row.append('<td>');

  const Mf = mf.cargaRepartida * Math.pow(mf.longitud, 3) / 12;

  row.append(`<td>${_.round(Mf, 2)}</td>`);
  row.append(`<td>${mcm}</td>`);
  row.append(`<td>${1}</td>`);
  row.append(`<td>${1/mf.longitud}</td>`);
  row.append(`<td>${1/mf.longitud * mcm}</td>`);

  return [row, Mf];
}

function generarFilaCargaPuntual(cargaPuntual, tipoMf, longitud, mcm) {
  let row = $('<tr>');
  row.append($(`<td>${tipoMf}</td>`));
  row.append('<td>');
  row.append(`<td>${cargaPuntual.valor}</td>`);
  row.append(`<td>${longitud}</td>`);
  row.append($(`<td>${!_.isNull(cargaPuntual.longitudIzquierda) && !_.isNaN(cargaPuntual.longitudIzquierda) ? cargaPuntual.longitudIzquierda : ''}</td>`));
  row.append($(`<td>${!_.isNull(cargaPuntual.longitudDerecha) && !_.isNaN(cargaPuntual.longitudDerecha) ? cargaPuntual.longitudDerecha : ''}</td>`));

  let Mf = cargaPuntual.valor * longitud / 8;

  row.append(`<td>${_.round(Mf, 3)}</td>`);
  row.append(`<td>${mcm}</td>`);
  row.append(`<td>${1}</td>`);
  row.append(`<td>${1/longitud}</td>`);
  row.append(`<td>${1/longitud * mcm}</td>`);

  return [row, Mf];
}

function generarFilaSumarizada(tipoMf, longitud, mcm, sumaMfs) {
  let row = $('<tr>');
  row.append($(`<td>${tipoMf}</td>`));
  row.append('<td>');
  row.append('<td></td>');
  row.append(`<td>${longitud}</td>`);
  row.append('<td></td>');
  row.append('<td></td>');

  row.append(`<td>${_.round(sumaMfs, 2)}</td>`);
  row.append(`<td>${mcm}</td>`);
  row.append(`<td>${1}</td>`);
  row.append(`<td>${1/longitud}</td>`);
  row.append(`<td>${1/longitud * mcm}</td>`);

  return row;
}

function existeCargaRepartidaParaMf(nombreMf) {
  return _.isBoolean(_.find(data.mfs, (mf) => mf.mf === nombreMf && !mf.cargaRepartida));
}

function crearCargaPuntual(event) {
  event.preventDefault();
  let n = $('.carga-puntual').length;

  let template = (n > 0 ? '<hr>' : '' )+ `
  <div class="carga-puntual">
        <!-- Text input-->
        <div class="form-group row mf">
          <label class="col-md-4 control-label">Carga puntual (P)</label>
          <div class="col-md-5">
            <label>
              <input name="P-${n}" type="text" placeholder="Carga puntual" class="form-control input-md"
                     required="">
            </label>

          </div>
        </div>

        <!-- Multiple Radios (inline) -->
        <div class="form-group row mf">
          <label class="col-md-4 control-label"></label>
          <div class="col-md-4">
            <label class="radio-inline">
              <input type="radio" name="excentricaCentrica-${n}" value="excentrica"
                     checked="checked">
              Excéntrica
            </label>
            <label class="radio-inline">
              <input type="radio" name="excentricaCentrica-${n}" value="centrica">
              Céntrica
            </label>
          </div>
        </div>


        <!-- Text input-->
        <div class="form-group row mf centrica">
          <label class="col-md-4 control-label">Longitud izquierda (a)</label>
          <div class="col-md-5">
            <label>
              <input name="a-${n}" type="text" placeholder="Longitud izquierda" class="form-control input-md"
                     required="">
            </label>

          </div>
        </div>

        <!-- Text input-->
        <div class="form-group row mf centrica">
          <label class="col-md-4 control-label">Longitud derecha (b)</label>
          <div class="col-md-5">
            <label>
              <input name="b-${n}" type="text" placeholder="Longitud derecha" class="form-control input-md"
                     required="">
            </label>
          </div>
        </div>
      </div>
  `;

  $('#cargasPuntuales').append(template);
}

function generarTablaIteracion(event) {
  event.preventDefault();

  let encabezado = '<td></td>' + generarEncabezado();
  let subEncabezado = '<td></td>' + generarSubencabezado();

  let filaK = '<td>K</td>' + _.range(data.mfs.length).map(() => `<td>${_.round(_.random(5, 60, true), 2)}</td>`);
  let filaFD = '<td>F.D</td>' + _.range(data.mfs.length).map(() => `<td>${_.round(_.random(0, 1, true))}</td>`);

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
  tableBody.append(`<tr>${filaK}</tr>`);
  tableBody.append(`<tr>${filaFD}</tr>`);
  tableBody.append(iteraciones);

  table.append(tableBody);
  const divResultado = $('#resultado');
  divResultado.empty();
  divResultado.append(table);
  // $('#tblResultado').DataTable({
  //   paging: false,
  //   ordering: false,
  //   info: false,
  //   searching: false
  // });
}

function generarEncabezado() {
  let letras = [... new Set(data.mfs.map(e => _.head(e.mf)).sort())];

  return letras.map(e => {

    const contador = data.mfs.filter(d => _.head(d.mf) === e).length;
    return `<td colspan="${contador}" style="text-align: center;">${e}</td>`;
  }).join('');
}

function generarSubencabezado() {
  let letras = [... new Set(data.mfs.map(e => _.head(e.mf)).sort())];
  return letras.map(l => data.mfs.filter(f => _.head(f.mf) === l).map(m => `<td style="text-align: center;">${m.mf}</td>`).join('')).join('');
}
