/**
*	SISTEMA DE REPOSITORIO DIGITAL DOCUMENTAL
*	AREA DE SECRETARIA - FACULTAD DE INGENIERIA - UCSG
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
        Id int NOT NULL PRIMARY KEY IDENTITY(1,1),
        IdCarpeta int,
        NombreArchivo varchar(255),
        Ruta varchar(255),
        RefArchivo varchar(255),
        FechaCarga datetime,
        Tamano decimal(18, 2),
        Extension varchar(10),
        Estado int,
        Tipo VARCHAR(15);
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
        [Estado] INT,
        Tipo VARCHAR(15);
        Ruta VARCHAR(255);
        IdHijos VARCHAR(255);
    );
END

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Carrera]') AND type in (N'U'))
BEGIN
    CREATE TABLE [Carrera] (
        [Id] INT NOT NULL IDENTITY(1,1) PRIMARY KEY,
        [Nombre] VARCHAR(255)
    );
END

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DocumentoDetalleKardex]') AND type in (N'U'))
BEGIN
    CREATE TABLE [DocumentoDetalleKardex] (
        Id int NOT NULL PRIMARY KEY IDENTITY(1,1),
        Ciclo varchar(255),
        Materia varchar(255),
        Periodo varchar(255),
        Calificacion decimal(18, 2),
        NoMatricula int,
        IdDocumentoKardex int,
        Estado int
    );
END

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TipoDocumentoKardex]') AND type in (N'U'))
BEGIN
    CREATE TABLE [TipoDocumentoKardex] (
        Id int NOT NULL PRIMARY KEY IDENTITY(1,1),
        IdDocumento int not null,
        Alumno varchar(255),
        NoIdentificacion varchar(255),
        Estado int,
        NotaGraduacionSeminario decimal(18, 2),
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
ALTER TABLE [dbo].[Documento] ADD CONSTRAINT IdCarpeta_fk FOREIGN KEY (IdCarpeta) REFERENCES Carpeta (Id);
ALTER TABLE [dbo].[TipoDocumentoKardex] ADD CONSTRAINT IdDocumento_fk FOREIGN KEY ([IdDocumento]) REFERENCES Documento (Id);
ALTER TABLE [dbo].[DocumentoDetalleKardex] ADD CONSTRAINT IdDocumentoKardex_fk FOREIGN KEY ([IdDocumentoKardex]) REFERENCES [dbo].[TipoDocumentoKardex] (Id);

--DDL INSERTS

INSERT INTO [dbo].[Carrera]   ([Nombre])
VALUES ('INGENIERÍA EN SISTEMAS COMPUTACIONALES');

INSERT INTO [dbo].[Carrera]   ([Nombre])
VALUES ('INGENIERÍA CIVIL');