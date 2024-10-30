/**
*	SISTEMA DE REPOSITORIO DIGITAL DOCUMENTAL
*	�REA DE SECRETAR�A - FACULTAD DE INGENIER�A - UCSG
**/

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Usuario]') AND type in (N'U'))
BEGIN
    CREATE TABLE [Usuario] (
        [Id] INT NOT NULL IDENTITY(1,1) PRIMARY KEY,
        [Nombre] VARCHAR(255),
        [Apellido] INT,
        [Email] VARCHAR(255),
        [Contrasena] VARCHAR(255),
        [Estado] INT
    );
END

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Documento]') AND type in (N'U'))
BEGIN
    CREATE TABLE [Documento] (
        [Id] INT NOT NULL IDENTITY(1,1) PRIMARY KEY,
        [IdCarpeta] INT,
        [NombreArchivo] VARCHAR(255),
        [Alumno] VARCHAR(255),
        [NoIdentificacion] VARCHAR(255),
        [Ruta] VARCHAR(255),
        [RefArchivo] VARCHAR(255),
        [FechaCarga] DATETIME,
        [Tamano] DECIMAL(18, 2),
        [Extension] VARCHAR(10),
        [Estado] INT
    );
END

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Carpeta]') AND type in (N'U'))
BEGIN
    CREATE TABLE [Carpeta] (
        [Id] INT NOT NULL IDENTITY(1,1) PRIMARY KEY,
        [Nombre] VARCHAR(255),
        [IdCarpetaPadre] INT,
        [FechaCreacion] DATETIME,
        [FechaActualizacion] DATETIME,
        [IdCarrera] INT,
        [Estado] INT
    );
END

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Carrera]') AND type in (N'U'))
BEGIN
    CREATE TABLE [Carrera] (
        [Id] INT NOT NULL IDENTITY(1,1) PRIMARY KEY,
        [Nombre] VARCHAR(255)
    );
END

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DocumentoDetalle]') AND type in (N'U'))
BEGIN
    CREATE TABLE [DocumentoDetalle] (
        [Id] INT NOT NULL IDENTITY(1,1) PRIMARY KEY,
        [Ciclo] VARCHAR(255),
        [Materia] VARCHAR(255),
        [Periodo] VARCHAR(255),
        [Calificacion] DECIMAL(18, 2),
        [NoMatricula] INT,
        [IdDocumento] INT,
        [Estado] INT
    );
END

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[UsuarioCarrera]') AND type in (N'U'))
BEGIN
    CREATE TABLE [UsuarioCarrera] (
        [Id] INT NOT NULL IDENTITY(1,1) PRIMARY KEY,
        [IdUsuario] INT,
        [IdCarrera] INT,
        [Estado] INT
    );
END

--CLAVES FOR�NEAS

ALTER TABLE [UsuarioCarrera] ADD CONSTRAINT [UsuarioCarrera_IdUsuario_fk] FOREIGN KEY ([IdUsuario]) REFERENCES [Usuario] ([Id]);
ALTER TABLE [UsuarioCarrera] ADD CONSTRAINT [UsuarioCarrera_IdCarrera_fk] FOREIGN KEY ([IdCarrera]) REFERENCES [Carrera] ([Id]);
ALTER TABLE [Carpeta] ADD CONSTRAINT [Carpeta_IdCarrera_fk] FOREIGN KEY ([IdCarrera]) REFERENCES [Carrera] ([Id]);
ALTER TABLE [Carpeta] ADD CONSTRAINT [Carpeta_IdCarpetaPadre_fk] FOREIGN KEY ([IdCarpetaPadre]) REFERENCES [Carpeta] ([Id]);
ALTER TABLE [Documento] ADD CONSTRAINT [Documento_IdCarpeta_fk] FOREIGN KEY ([IdCarpeta]) REFERENCES [Carpeta] ([Id]);
ALTER TABLE [DocumentoDetalle] ADD CONSTRAINT [DocumentoDetalle_IdDocumento_fk] FOREIGN KEY ([IdDocumento]) REFERENCES [Documento] ([Id]);

--DDL INSERTS

INSERT INTO [dbo].[Carrera]   ([Nombre])
VALUES ('INGENIERÍA EN COMPUTACIÓN');

INSERT INTO [dbo].[Carrera]   ([Nombre])
VALUES ('INGENIERÍA CIVIL');