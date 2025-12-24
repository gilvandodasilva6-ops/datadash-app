import { Language } from '../types';

export const translations = {
  en: {
    appTitle: "DataDash",
    nav: {
      dashboard: "Dashboard",
      quality: "Quality Report",
      reset: "New Upload",
      logout: "Sign Out"
    },
    auth: {
      loginTitle: "Welcome Back",
      signupTitle: "Create Account",
      emailLabel: "Email Address",
      passwordLabel: "Password",
      nameLabel: "Full Name",
      loginBtn: "Sign In",
      signupBtn: "Sign Up",
      switchToSignup: "Don't have an account? Sign up",
      switchToLogin: "Already have an account? Sign in",
      loading: "Please wait...",
      magicLinkSent: "Check your email for the login link!",
      error: "Authentication failed. Please check your credentials."
    },
    hero: {
      titleStart: "Your Data,",
      titleEnd: "Visualized.",
      subtitle: "Instantly analyze Excel and CSV files. Automatic insights, interactive dashboards, and data quality checks—running 100% in your browser.",
      clickUpload: "Click to upload",
      dragDrop: "XLSX, CSV (Max 30MB)",
      loading: "Crunching numbers...",
      error: "Failed to process file. Ensure it is a valid CSV or Excel file."
    },
    features: {
      smartTitle: "Smart Detection",
      smartDesc: "Auto-identifies dates, metrics, and categories.",
      chartsTitle: "Instant Charts",
      chartsDesc: "Generates KPIs, distributions, and trends instantly.",
      privacyTitle: "Secure Cloud",
      privacyDesc: "Your data is encrypted and protected with Row Level Security."
    },
    dashboard: {
      measure: "Measure",
      dimension: "Dimension",
      export: "Export CSV",
      countRows: "(Count Rows)",
      kpiRecords: "Total Records",
      kpiTotal: "Total",
      kpiAvg: "Avg",
      kpiCols: "Columns",
      chartTimeline: "Timeline Analysis",
      chartTop: "Top 10",
      chartShare: "Share by",
      chartDist: "Distribution",
      tablePreview: "Raw Data Preview (First 50 Rows)",
      frequency: "Frequency"
    },
    quality: {
      title: "Data Health Report",
      subtitle: (rows: string, cols: number) => `Automated profiling of ${rows} rows and ${cols} columns.`,
      unique: "Unique",
      completeness: "Completeness",
      min: "Min",
      max: "Max",
      average: "Average",
      examples: "Examples",
      missing: "missing values found",
      allUnique: "All values unique (ID candidate)"
    },
    modeling: {
        title: "Data Modeling",
        subtitle: "Define relationships between your sheets to create a unified view.",
        factTable: "Main Fact Table",
        factHelp: "Select the central table containing your metrics (e.g. Sales, Orders).",
        joins: "Relationships",
        addJoin: "Add Join",
        noJoins: "No joins defined. The dashboard will only show the Fact table.",
        duplicateKeyWarning: "Warning: Right-side key is not unique. This may cause row duplication.",
        previewTitle: "Unified Data Preview",
        analyze: "Generate Dashboard",
        previewNote: "Showing first 50 rows of the joined result."
    }
  },
  pt: {
    appTitle: "DataDash",
    nav: {
      dashboard: "Painel",
      quality: "Relatório de Qualidade",
      reset: "Novo Upload",
      logout: "Sair"
    },
    auth: {
      loginTitle: "Bem-vindo de volta",
      signupTitle: "Criar Conta",
      emailLabel: "Endereço de E-mail",
      passwordLabel: "Senha",
      nameLabel: "Nome Completo",
      loginBtn: "Entrar",
      signupBtn: "Cadastrar",
      switchToSignup: "Não tem conta? Cadastre-se",
      switchToLogin: "Já tem conta? Entre agora",
      loading: "Aguarde...",
      magicLinkSent: "Verifique seu e-mail para confirmar o cadastro!",
      error: "Falha na autenticação. Verifique seus dados."
    },
    hero: {
      titleStart: "Seus Dados,",
      titleEnd: "Visualizados.",
      subtitle: "Analise instantaneamente arquivos Excel e CSV. Insights automáticos, dashboards interativos e verificação de qualidade — rodando 100% no seu navegador.",
      clickUpload: "Clique para carregar",
      dragDrop: "XLSX, CSV (Max 30MB)",
      loading: "Processando dados...",
      error: "Falha ao processar arquivo. Certifique-se que é um CSV ou Excel válido."
    },
    features: {
      smartTitle: "Detecção Inteligente",
      smartDesc: "Identifica datas, métricas e categorias automaticamente.",
      chartsTitle: "Gráficos Instantâneos",
      chartsDesc: "Gera KPIs, distribuições e tendências na hora.",
      privacyTitle: "Nuvem Segura",
      privacyDesc: "Seus dados são criptografados e protegidos com Segurança em Nível de Linha (RLS)."
    },
    dashboard: {
      measure: "Medida",
      dimension: "Dimensão",
      export: "Exportar CSV",
      countRows: "(Contar Linhas)",
      kpiRecords: "Total de Registros",
      kpiTotal: "Total",
      kpiAvg: "Média",
      kpiCols: "Colunas",
      chartTimeline: "Análise Temporal",
      chartTop: "Top 10",
      chartShare: "Divisão por",
      chartDist: "Distribuição",
      tablePreview: "Prévia dos Dados (Primeiras 50 Linhas)",
      frequency: "Frequência"
    },
    quality: {
      title: "Relatório de Saúde dos Dados",
      subtitle: (rows: string, cols: number) => `Perfilamento automático de ${rows} linhas e ${cols} colunas.`,
      unique: "Únicos",
      completeness: "Completude",
      min: "Mín",
      max: "Máx",
      average: "Média",
      examples: "Exemplos",
      missing: "valores ausentes encontrados",
      allUnique: "Todos valores únicos (candidato a ID)"
    },
    modeling: {
        title: "Modelagem de Dados",
        subtitle: "Defina relacionamentos entre as abas para criar uma visão unificada.",
        factTable: "Tabela Fato (Principal)",
        factHelp: "Selecione a tabela central contendo métricas (ex: Vendas, Pedidos).",
        joins: "Relacionamentos",
        addJoin: "Adicionar Junção",
        noJoins: "Nenhuma junção definida. O dashboard mostrará apenas a Tabela Fato.",
        duplicateKeyWarning: "Aviso: Chave da direita não é única. Pode causar duplicação de linhas.",
        previewTitle: "Prévia dos Dados Unificados",
        analyze: "Gerar Dashboard",
        previewNote: "Exibindo as primeiras 50 linhas do resultado da junção."
    }
  }
};