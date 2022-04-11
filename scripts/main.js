let data = {};

$(() => {
    init();

    $('#frmInicioCapturaDatos').on('submit', iniciarCapturaDatos);
    $('#btnAgregarElemento').on('click', agregarElemento);
    $('#btnAgregarNuevoElemento').on('click', agregarNuevoElemento);
    $('#btnAgregarNuevoMF').on('click', agregarNuevoMF);
    $('#btnAgregarMf').on('click', agregarMf);

    $('input[type=radio][name=excentricaCentrica]').on('change', function() {
        switch ($(this).val()) {
          case 'excentrica':
            $('.centrica').show();
            break;
          case 'centrica':
            $('.centrica').hide();
            break;
        }
      });
});

function init() {
    $('.mf').hide();
    $('.data').hide();
    $('.captura').hide();
    $('.elemento').hide();
    $('.row-elementos').hide();
    $('.hr-elementos').hide();

    data = {
        elementos: []
    }
}

function iniciarCapturaDatos(event) {
    event.preventDefault();

    $('#btnIniciarCaptura').hide();
    $('#E').prop('disabled', true);
    $('input[name="unidadMedida"]').prop('disabled', true);
    $('.captura').show();
    $('.data').show();

    data['E'] = parseInt($('#E').val());
    data['unidadMedida'] = $('input[name="unidadMedida"]').val();
}

function agregarElemento(event) {
    event.preventDefault();

    $('#btnAgregarElemento').prop('disabled', 'off');
    $('.elemento').show();

    $('#B').focus();
}

function agregarNuevoElemento(event) {
    event.preventDefault();

    let tipo = $('#elemento').val();
    let B = parseFloat($('#B').val());
    let H = parseFloat($('#H').val());
    let E = parseFloat($('#E').val());

    let id = data.elementos.filter(e => e.tipo == tipo).length + 1;
    let elemento = new Elemento(id, tipo, B, H);

    data.elementos.push(elemento);

    if (data.elementos.length === 1) {
        $('.hr-elementos').show();
        $('.row-elementos').show();
    }

    limpiarCamposElemento();
    $('#tipoElemento').append(`<option value="${tipo}${id}">${tipo == 'vg' ? 'Viga' : 'Columna'}-${id}</option>`)
    
    if (data.elementos.length == 1) {
        $('#btnAgregarNuevoMF').prop('disabled', false);
    }

    $('#btnAgregarElemento').prop('disabled', false);

    alertify.success('Se ha creado un nuevo elemento.');
    $('.elemento').hide(1000);

    actualizarTablaElementos(elemento);
}

function limpiarCamposElemento() {
    $('#B').val('');
    $('#H').val('');
    $('#E').val('');
}

function agregarNuevoMF(event) {
    event.preventDefault();

    $(this).prop('disabled', true);

    $('.mf').show();
}

function agregarMf(event) {
    event.preventDefault();

    $(this).prop('disabled', false);

    $('.mf').hide();
}

function actualizarTablaElementos(elemento) {
    let nuevoElemento = $('<tr>');
    nuevoElemento.append(`<td>${elemento.tipo == 'vg' ? 'Viga-' + elemento.id : 'Columna-' + elemento.id}</td>`);
    nuevoElemento.append(`<td>${elemento.B}</td>`);
    nuevoElemento.append(`<td>${elemento.H}</td>`);
    nuevoElemento.append(`<td>${(1/2) * elemento.B * Math.pow(elemento.H, 2)}</td>`);
    nuevoElemento.append(`<td>${1}</td>`);

    $('#tblElementos').append(nuevoElemento);
}
