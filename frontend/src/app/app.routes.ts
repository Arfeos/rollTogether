import { Routes } from '@angular/router';
import { IndexComponent } from './componentes/index/index.component';
import { PartidaComponent } from './componentes/partida/partida.component';
import { PerfilComponent } from './componentes/perfil/perfil.component';
import { AdministracionComponent } from './componentes/administracion/administracion.component';
import { ListarUsuariosComponent } from './componentes/listar-usuarios/listar-usuarios.component';
import { ListarPartidasComponent } from './componentes/listar-partidas/listar-partidas.component';
import { ListarReportesComponent } from './componentes/listar-reportes/listar-reportes.component';
import { CrearCategoriaSistemaComponent } from './componentes/crear-categoria-sistema/crear-categoria-sistema.component';
import { CrearPartidaComponent } from './componentes/crear-partida/crear-partida.component';
import { ModificarPartidaComponent } from './componentes/modificar-partida/modificar-partida.component';
import { MisPartidasComponent } from './componentes/mis-partidas/mis-partidas.component';
import { PartidasInscritasComponent } from './componentes/partidas-inscritas/partidas-inscritas.component';
import { UsariosInscritosComponent } from './componentes/usarios-inscritos/usarios-inscritos.component';
import { DetalleReporteComponent } from './componentes/detalle-reporte/detalle-reporte.component';
import { ListarCategoriasComponent } from './componentes/listar-categorias/listar-categorias.component';
import { ListarSistemasComponent } from './componentes/listar-sistemas/listar-sistemas.component';
export const routes: Routes = [

  {
    path: "inicio",
    component: IndexComponent
  },
  {
    path: 'partida/:id_partida',
    component: PartidaComponent
  },
  {
    path: "perfil/:id_perfil",
    component: PerfilComponent
  },
  {
    path: "admin",
    component: AdministracionComponent
  },
  {
    path: "admin/usuarios",
    component: ListarUsuariosComponent
  },
  {
    path: "admin/partidas",
    component: ListarPartidasComponent
  },
  {
    path: "admin/reportes",
    component: ListarReportesComponent
  },
   { path: "admin/sistemas",
    component: ListarSistemasComponent
  },
    {path: "admin/categorias",
    component: ListarCategoriasComponent
  },
  {
    path: "admin/crear",
    component: CrearCategoriaSistemaComponent
  },
  {
    path: "crear-partida",
    component: CrearPartidaComponent
  },
  {
    path: "modificarPartida/:partida_id",
    component: ModificarPartidaComponent
  },
  {
    path: "Mis-partidas",
    component: MisPartidasComponent
  },
  {
    path: "Partidas-inscritas",
    component: PartidasInscritasComponent
  },
   { path: "usuariosIncritos/:partida_id",
    component: UsariosInscritosComponent
  },
   { path: "reporte/:reporte_id",
    component: DetalleReporteComponent
  },
  {
    path: "**",
    redirectTo: "inicio",
    pathMatch: "full"
  }

];