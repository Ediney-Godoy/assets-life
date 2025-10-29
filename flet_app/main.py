import flet as ft
import requests

API_BASE = "http://127.0.0.1:8000"
AUTH_TOKEN = None


def fetch_json(path: str, method: str = "GET", json=None):
    url = f"{API_BASE}{path}"
    try:
        headers = {}
        if AUTH_TOKEN:
            headers["Authorization"] = f"Bearer {AUTH_TOKEN}"
        if method == "GET":
            r = requests.get(url, headers=headers)
        elif method == "POST":
            r = requests.post(url, json=json, headers=headers)
        elif method == "PUT":
            r = requests.put(url, json=json, headers=headers)
        elif method == "DELETE":
            r = requests.delete(url, headers=headers)
        else:
            raise ValueError("Unsupported method")
        r.raise_for_status()
        if r.text:
            return r.json()
        return None
    except Exception as e:
        print("API error", e)
        raise


def permisos_page(page: ft.Page):
    page.title = "Permissões"
    page.horizontal_alignment = ft.CrossAxisAlignment.START
    page.padding = 20

    search = ft.TextField(label="Buscar grupos", on_change=lambda e: load_groups())
    new_btn = ft.FilledButton(
        "+ Novo Grupo de Permissões",
        icon=ft.Icons.ADD,
        on_click=lambda e: page.go("/permissoes/novo")
    )

    cards_container = ft.Column(spacing=12)

    def load_groups():
        cards_container.controls.clear()
        groups = fetch_json("/permissoes/grupos")
        q = (search.value or "").strip().lower()
        if q:
            groups = [g for g in groups if q in (g["nome"].lower() + " " + (g.get("descricao") or "").lower())]
        for g in groups:
            card = ft.Card(
                content=ft.Container(
                    padding=12,
                    content=ft.Column([
                        ft.Row([
                            ft.Text(g["nome"], weight=ft.FontWeight.BOLD, size=16),
                            ft.Row([
                                ft.IconButton(icon=ft.Icons.VISIBILITY, tooltip="Visualizar",
                                              on_click=lambda e, gid=g["id"]: page.go(f"/permissoes/{gid}")),
                                ft.IconButton(icon=ft.Icons.EDIT, tooltip="Editar",
                                              on_click=lambda e, gid=g["id"]: page.go(f"/permissoes/{gid}/editar")),
                                ft.IconButton(icon=ft.Icons.DELETE, tooltip="Excluir",
                                              on_click=lambda e, gid=g["id"]: delete_group(gid)),
                            ])
                        ]),
                        ft.Text(g.get("descricao") or "", size=13),
                        ft.Row([
                            ft.Text(f"Usuários: {g['usuarios']}", color=ft.colors.BLUE_GREY),
                            ft.Text(f"Empresas: {g['empresas']}", color=ft.colors.BLUE_GREY),
                            ft.Text(f"Transações: {g['transacoes']}", color=ft.colors.BLUE_GREY),
                        ])
                    ])
                )
            )
            cards_container.controls.append(card)
        page.update()

    def delete_group(gid: int):
        dlg = ft.AlertDialog(
            title=ft.Text("Confirmar exclusão"),
            content=ft.Text("Deseja remover este grupo?"),
            actions=[
                ft.TextButton("Cancelar", on_click=lambda e: close_dialog()),
                ft.FilledButton("Excluir", icon=ft.Icons.DELETE, on_click=lambda e: do_delete()),
            ]
        )

        def close_dialog():
            page.dialog.open = False
            page.update()

        def do_delete():
            try:
                fetch_json(f"/permissoes/grupos/{gid}", method="DELETE")
            finally:
                close_dialog()
                load_groups()

        page.dialog = dlg
        page.dialog.open = True
        page.update()

    page.add(
        ft.Row([ft.Text("Grupos de Permissões", size=22, weight=ft.FontWeight.BOLD), ft.Container(expand=1), new_btn]),
        search,
        cards_container
    )
    load_groups()


def novo_grupo_page(page: ft.Page):
    page.title = "Novo Grupo de Permissões"
    page.padding = 20

    # Aba 1 – Informações Básicas
    nome = ft.TextField(label="Nome do Grupo *", autofocus=True)
    descricao = ft.TextField(label="Descrição", multiline=True, min_lines=3)

    def salvar_basico(e):
        if not nome.value:
            page.snack_bar = ft.SnackBar(ft.Text("Nome do grupo é obrigatório."))
            page.snack_bar.open = True
            page.update()
            return
        data = fetch_json("/permissoes/grupos", method="POST", json={"nome": nome.value, "descricao": descricao.value})
        page.session.set("grupo_id", data["id"])  # persist across tabs
        page.snack_bar = ft.SnackBar(ft.Text("Grupo criado"))
        page.snack_bar.open = True
        page.update()

    abas_basico = ft.Container(
        content=ft.Column([
            nome,
            descricao,
            ft.Row([
                ft.TextButton("Cancelar", on_click=lambda e: page.go("/permissoes")),
                ft.Container(expand=1),
                ft.FilledButton("Salvar", icon=ft.Icons.SAVE, on_click=salvar_basico),
            ])
        ])
    )

    # Datasets comuns
    empresas_dd = ft.Dropdown(label="Selecionar Empresas")
    transacoes_dd = ft.Dropdown(label="Selecionar Transações (Telas)")
    usuarios_dd = ft.Dropdown(label="Selecionar Usuários")

    empresas_selecionadas = ft.Column()
    transacoes_selecionadas = ft.Column()
    usuarios_selecionados = ft.Column()

    def load_datasets():
        empresas = fetch_json("/companies")
        empresas_dd.options = [ft.dropdown.Option(str(e["id"]), e["name"]) for e in empresas]
        transacoes = fetch_json("/permissoes/transacoes")
        transacoes_dd.options = [ft.dropdown.Option(str(t["id"]), t["nome_tela"]) for t in transacoes]
        usuarios = fetch_json("/usuarios")
        usuarios_dd.options = [ft.dropdown.Option(str(u["id"]), u["nome_completo"]) for u in usuarios]
        page.update()

    def ensure_grupo_id():
        gid = page.session.get("grupo_id")
        if not gid:
            page.snack_bar = ft.SnackBar(ft.Text("Crie e salve as informações básicas primeiro."))
            page.snack_bar.open = True
            page.update()
        return gid

    # Aba 2 – Empresas
    def add_empresa(e):
        gid = ensure_grupo_id()
        if not gid or not empresas_dd.value:
            return
        fetch_json(f"/permissoes/grupos/{gid}/empresas", method="POST", json={"id": int(empresas_dd.value)})
        refresh_empresas()

    def clear_empresas(e):
        empresas_dd.value = None
        page.update()

    def refresh_empresas():
        gid = ensure_grupo_id()
        if not gid:
            return
        lst = fetch_json(f"/permissoes/grupos/{gid}/empresas")
        empresas_selecionadas.controls = [ft.Text(f"• {e['name']}") for e in lst]
        page.update()

    aba_empresas = ft.Container(
        content=ft.Column([
            empresas_dd,
            ft.Row([
                ft.FilledButton("Adicionar Selecionada", icon=ft.Icons.ADD, on_click=add_empresa),
                ft.OutlinedButton("Limpar Seleção", icon=ft.Icons.CLEAR, on_click=clear_empresas),
            ]),
            ft.Text("Empresas selecionadas:"),
            empresas_selecionadas,
        ])
    )

    # Aba 3 – Transações
    def add_transacao(e):
        gid = ensure_grupo_id()
        if not gid or not transacoes_dd.value:
            return
        fetch_json(f"/permissoes/grupos/{gid}/transacoes", method="POST", json={"id": int(transacoes_dd.value)})
        refresh_transacoes()

    def clear_transacoes(e):
        transacoes_dd.value = None
        page.update()

    def refresh_transacoes():
        gid = ensure_grupo_id()
        if not gid:
            return
        lst = fetch_json(f"/permissoes/grupos/{gid}/transacoes")
        transacoes_selecionadas.controls = [ft.Text(f"• {t['nome_tela']} ({t['rota']})") for t in lst]
        page.update()

    aba_transacoes = ft.Container(
        content=ft.Column([
            transacoes_dd,
            ft.Row([
                ft.FilledButton("Adicionar Selecionada", icon=ft.Icons.ADD, on_click=add_transacao),
                ft.OutlinedButton("Limpar Seleção", icon=ft.Icons.CLEAR, on_click=clear_transacoes),
            ]),
            ft.Text("Transações selecionadas:"),
            transacoes_selecionadas,
        ])
    )

    # Aba 4 – Usuários
    def add_usuario(e):
        gid = ensure_grupo_id()
        if not gid or not usuarios_dd.value:
            return
        fetch_json(f"/permissoes/grupos/{gid}/usuarios", method="POST", json={"id": int(usuarios_dd.value)})
        refresh_usuarios()

    def clear_usuarios(e):
        usuarios_dd.value = None
        page.update()

    def refresh_usuarios():
        gid = ensure_grupo_id()
        if not gid:
            return
        lst = fetch_json(f"/permissoes/grupos/{gid}/usuarios")
        usuarios_selecionados.controls = [ft.Text(f"• {u['nome_completo']}") for u in lst]
        page.update()

    aba_usuarios = ft.Container(
        content=ft.Column([
            usuarios_dd,
            ft.Row([
                ft.FilledButton("Adicionar Selecionado", icon=ft.Icons.ADD, on_click=add_usuario),
                ft.OutlinedButton("Limpar Seleção", icon=ft.Icons.CLEAR, on_click=clear_usuarios),
            ]),
            ft.Text("Usuários selecionados:"),
            usuarios_selecionados,
        ])
    )

    tabs = ft.Tabs(
        selected_index=0,
        tabs=[
            ft.Tab(text="Informações Básicas", content=abas_basico),
            ft.Tab(text="Empresas", content=aba_empresas),
            ft.Tab(text="Transações", content=aba_transacoes),
            ft.Tab(text="Usuários", content=aba_usuarios),
        ]
    )

    page.add(tabs)
    load_datasets()


def view_grupo_page(page: ft.Page, grupo_id: int):
    g = fetch_json(f"/permissoes/grupos/{grupo_id}")
    page.title = f"Grupo: {g['nome']}"
    page.padding = 20
    page.add(ft.Text(g["descricao"] or "", size=14))
    # resumo
    empresas = fetch_json(f"/permissoes/grupos/{grupo_id}/empresas")
    transacoes = fetch_json(f"/permissoes/grupos/{grupo_id}/transacoes")
    usuarios = fetch_json(f"/permissoes/grupos/{grupo_id}/usuarios")
    page.add(
        ft.Text("Empresas:"),
        ft.Column([ft.Text(f"• {e['name']}") for e in empresas]),
        ft.Text("Transações:"),
        ft.Column([ft.Text(f"• {t['nome_tela']} ({t['rota']})") for t in transacoes]),
        ft.Text("Usuários:"),
        ft.Column([ft.Text(f"• {u['nome_completo']}") for u in usuarios]),
    )


def router(page: ft.Page):
    page.theme_mode = ft.ThemeMode.LIGHT
    page.on_route_change = lambda e: go_route()
    page.on_view_pop = lambda e: page.go("/")

    def login_page():
        page.title = "Login"
        email = ft.TextField(label="E-mail", autofocus=True)
        senha = ft.TextField(label="Senha", password=True, can_reveal_password=True)

        def do_login(e):
            nonlocal email, senha
            try:
                data = fetch_json("/auth/login", method="POST", json={"email": email.value, "senha": senha.value})
                token = data["access_token"]
                global AUTH_TOKEN
                AUTH_TOKEN = token
                page.snack_bar = ft.SnackBar(ft.Text("Login realizado"))
                page.snack_bar.open = True
                page.update()
                page.go("/permissoes")
            except Exception:
                page.snack_bar = ft.SnackBar(ft.Text("Falha no login"))
                page.snack_bar.open = True
                page.update()

        page.add(
            ft.Container(padding=20, content=ft.Column([
                ft.Text("Acesso ao Sistema", size=22, weight=ft.FontWeight.BOLD),
                email,
                senha,
                ft.Row([
                    ft.FilledButton("Entrar", icon=ft.Icons.LOGIN, on_click=do_login),
                ])
            ]))
        )

    def go_route():
        page.views.clear()
        route = page.route
        if route == "/":
            page.views.append(ft.View(route, controls=[]))
            login_page()
        elif route == "/permissoes":
            page.views.append(ft.View(route, controls=[]))
            permisos_page(page)
        elif route == "/permissoes/novo":
            page.views.append(ft.View(route, controls=[]))
            novo_grupo_page(page)
        elif route.startswith("/permissoes/") and route.endswith("/editar"):
            gid = int(route.split("/")[2])
            page.views.append(ft.View(route, controls=[]))
            # reuse novo flow with pre-filled data (simple approach)
            page.session.set("grupo_id", gid)
            novo_grupo_page(page)
        elif route.startswith("/permissoes/"):
            gid = int(route.split("/")[2])
            page.views.append(ft.View(route, controls=[]))
            view_grupo_page(page, gid)
        else:
            page.views.append(ft.View(route, controls=[ft.Text("Rota não encontrada")]))
        page.update()

    go_route()


def main(page: ft.Page):
    router(page)


if __name__ == "__main__":
    ft.app(target=main, view=ft.AppView.WEB_BROWSER, port=5280)