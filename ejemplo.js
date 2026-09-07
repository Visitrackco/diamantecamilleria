try {

            $(".vt_signature").each(function(i, item) {
                var ele = $(item).html();
                $(item).css({
                    width: '260px',
                    height: '100px'
                })
            });

            moment.locale('es');
            console.log($("#fecha").html());

            var fecha = $("#fecha").html();
            var inicio_vacaciones = $("span#inicio_vacaciones").html();
            var fin_vacaciones = $("span#fin_vacaciones").html();
            var reintegro = $("span#reintegro").html();
            var dia_familia = $("span#dia_familia").html();
            var dia_familia = $("span#dia_familia").html();

            var fechaentera = moment(fecha).format("LL");
            var fecha_dia = moment(fecha).format("LL");
            var inicio_vacaciones_transformada = moment(inicio_vacaciones).format("DD-MM-YYYY");
            var fin_vacaciones_transformada = moment(fin_vacaciones).format("DD-MM-YYYY");
            var reintegro_transformada = moment(reintegro).format("DD-MM-YYYY");
            var dia_familia_transformada = moment(dia_familia).format("DD-MM-YYYY");


            $("span#dia_servicio").each(function(i, item) {
                var ele = $(item).html("<span>" + fecha_dia + "</span>");
                $(ele).text((fecha_dia));
                console.log(ele);
            });

            $("span#fecha_inicio").append(inicio_vacaciones_transformada)
            $("span#fecha_fin").append(fin_vacaciones_transformada)
            $("span#fecha_reintegro").append(reintegro_transformada)
            if (dia_familia_transformada != "Invalid date") {
                $("span#fecha_dia_familia").append(dia_familia_transformada)
            }



            var es_dia_familia = $("span#es_dia_familia").html();

            // if (es_dia_familia == "NO") {
            //     $("tr#dia_familia").hide()
            // } else {
            //     console.log("si es dia de la familia")
            // }

            $(".vt_picture").each(function(i, item) {
                var ele = $(item).html();
                $(item).css({
                    width: '180px',
                    height: '115px'
                })
            });


        } catch (exc) {
            app.excManager("ucCustomReport", "AfterLoad", exc);
        }